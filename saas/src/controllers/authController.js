import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import traccarService from '../services/traccar.js';
import { emailQueue } from '../services/queue.js';
import logAudit from '../utils/auditLogger.js';
import cache from '../services/cache.js';

// Validation Schemas

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});


const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  mfaToken: z.string().optional(),
  ipAddress: z.string().optional(),
  device: z.string().optional(),
});

export const register = async (req, res, next) => {
  let traccarUser = null;
  let traccarDevice = null;

  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: parseResult.error.errors.map(e => e.message) 
      });
    }

    const { name, email, phone, password } = req.body;


    // 1. Initial Local Check (Optimistic)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // 2. Prepare Data
    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3. Traccar Integration (Phase 2: Resilient Saga)
    try {
      traccarUser = await traccarService.createUser(name, email, password);
      // Traccar user created: traccarUser.id

    } catch (traccarErr) {
      console.error('[Registration] Traccar integration failed:', traccarErr.message);
      
      // Dynamic Fallback: Allow SaaS-only registration in dev/recovery mode
      if (process.env.NODE_ENV !== 'production' || process.env.MOCK_TRACCAR === 'true') {
        console.warn('[Registration] Entering Sync-Pending mode due to Traccar unavailability.');
        traccarUser = { id: 0, name, email }; // Virtual mock user
      } else {
        return res.status(503).json({
          error: 'Registration temporarily unavailable',
          detail: 'The tracking backend is not responding. Please try again in a few minutes.'
        });
      }
    }


    // 4. Atomic SaaS DB Update
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        return await tx.user.create({
          data: {
            name,
            email,
            phone,
            password: hashedPassword,
            traccarUserId: traccarUser?.id,
            emailVerificationToken,
            emailVerificationExpires: verificationExpires,
          }
        });
      });
    } catch (dbErr) {
      console.error('[Registration] SaaS DB transaction failed. Rolling back Traccar...', dbErr.message);
      // Saga Rollback: Clean up Traccar if SaaS DB fails
      if (traccarUser?.id && traccarUser.id !== 0) {
         await traccarService.deleteUser(traccarUser.id).catch(err => console.error('Rollback User failed:', err.message));
      }
      
      if (dbErr.code === 'P2002') {
        return res.status(409).json({ error: 'User with this email already exists (concurrent conflict).' });
      }
      throw dbErr; // Let next(error) handle other DB errors
    }


    // 5. Post-Registration Activities (Non-blocking)
    try {
      await emailQueue.add('SEND_VERIFICATION_EMAIL', { to: email, token: emailVerificationToken });
    } catch (queueErr) {
      console.warn(`[Registration] Email verification queueing failed:`, queueErr.message);
    }

    await logAudit({ 
      userId: user.id, 
      action: 'REGISTER', 
      resource: 'User', 
      ipAddress: req.ip, 
      payload: { email: user.email } 
    });

    res.status(201).json({ 
      message: 'Registration successful. Please verify your email.', 
      user: { id: user.id, email: user.email, name: user.name } 
    });

  } catch (error) {
    console.error('[Registration] Unexpected failure:', error.message);
    
    // Explicit 500 mapping for frontend resilience
    res.status(500).json({
      error: 'An unexpected internal error occurred during registration.',
      traceId: req.headers['x-correlation-id'] || 'N/A'
    });
  }
};

export const login = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: parseResult.error.errors.map(e => e.message) 
      });
    }
    const { email, password, mfaToken, ipAddress, device } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      if (user.isTotpEnabled) {
        if (!mfaToken) {
          return res.status(200).json({ mfaRequired: true, message: 'MFA token required' });
        }
        const verified = speakeasy.totp.verify({
          secret: user.totpSecret,
          encoding: 'base32',
          token: mfaToken
        });
        if (!verified) {
          return res.status(401).json({ error: 'Invalid MFA token' });
        }
      }

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockUntil: null }
        });
      } catch (dbErr) {
        console.warn(`[Login] Non-critical reset failed for user ${user.id}:`, dbErr.message);
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is locked or suspended' });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      const jwtOptions = user.role === 'ADMIN' 
        ? { expiresIn: '24h' } 
        : { expiresIn: process.env.JWT_EXPIRATION || '7d' };

      const token = jwt.sign(
        { userId: user.id, role: user.role, traccarUserId: user.traccarUserId },
        process.env.JWT_SECRET,
        jwtOptions
      );

      const clientIp = req.ip || ipAddress || req.connection.remoteAddress;

      await logAudit({ 
        userId: user.id, 
        action: 'LOGIN', 
        resource: 'User', 
        ipAddress: clientIp,
        payload: { success: true }
      });


      res.json({ 
        message: 'Login successful', 
        token, 
        role: user.role, 
        traccarUserId: user.traccarUserId,
        // Premium Traccar-Synced User Object
        id: user.traccarUserId,
        email: user.email,
        name: user.name,
        admin: user.role === 'ADMIN',
        map: 'osm',
        distanceUnit: 'km',
        speedUnit: 'kn',
        latitude: 0,
        longitude: 0,
        zoom: 0,
        twelveHourFormat: false,
        coordinateFormat: 'dd',
        disabled: false,
        readonly: false,
        deviceReadonly: false,
        userLimit: 0,
        deviceLimit: 0,
        expirationTime: null,
        attributes: {
          branding: 'GeoSurePath',
          tier: 'Elite'
        }
      });

    } else {
      const attempts = user.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts, lockUntil }
        });
      } catch (dbErr) {
        console.warn(`[Login] Non-critical attempt update failed for user ${user.id}:`, dbErr.message);
      }

      await logAudit({ 
        userId: user.id, 
        action: 'LOGIN_FAILURE', 
        resource: 'User', 
        ipAddress: req.ip || ipAddress,
        payload: { attempts }
      });

      res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      await prisma.loginHistory.create({
        data: { userId: user.id, ipAddress, device, success: isMatch }
      });
    } catch (dbErr) {
      console.warn(`[Login] Non-critical history record failed:`, dbErr.message);
    }

  } catch (error) {
    console.error('[Login] Internal server error:', error.message);
    res.status(500).json({ error: 'Internal server error during login. Please try again later.' });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    // Return same message even on error to prevent timing attacks/enumeration
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  }

};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await prisma.user.findFirst({ 
      where: { 
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      } 
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const setupMFA = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const secret = speakeasy.generateSecret({ name: `GeoSurePath (${user.email})` });
    
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret.base32, isTotpEnabled: false }
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrCodeUrl });
  } catch (error) {
    next(error);
  }
};

export const verifyMFA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user.totpSecret) return res.status(400).json({ error: 'MFA not set up' });

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isTotpEnabled: true }
      });
      res.json({ message: 'MFA enabled successfully' });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // Blacklist for 7 days
    await cache.set(`revoked_token:${token}`, true, 7 * 24 * 60 * 60);
    
    await logAudit({
      userId: req.user?.userId,
      action: 'LOGOUT',
      resource: 'User',
      ipAddress: req.ip
    });
  }

  res.json({ message: 'Logged out successfully' });
};
