// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const traccarService = require('../services/traccar');
const { emailQueue } = require('../services/queue');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

const crypto = require('crypto');

// Helper for input validation (Upgrade: Use zod/joi in production)
const validateInput = (fields, data) => {
  for (const field of fields) {
    if (!data[field]) return { valid: false, error: `${field} is required` };
  }
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return { valid: false, error: 'Invalid email format' };
  if (data.password && data.password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  return { valid: true };
};

exports.register = async (req, res) => {
  const validation = validateInput(['name', 'email', 'password', 'vehicleName', 'deviceImei'], req.body);
  if (!validation.valid) return res.status(400).json({ error: validation.error });

  const { name, email, phone, password, vehicleName, vehicleType, vehiclePlate, deviceImei } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    let traccarUser;
    try {
      traccarUser = await traccarService.createUser(name, email, password);
    } catch (err) {
      if (err.message && /duplicate|unique/i.test(err.message)) {
        throw new Error('Email is already registered in Traccar. Please login.');
      }
      throw err;
    }
    
    let traccarDevice;
    try {
      traccarDevice = await traccarService.createDevice(vehicleName, deviceImei);
    } catch (err) {
      await traccarService.deleteUser(traccarUser.id).catch(e => console.error('Rollback cleanup failed:', e));
      if (err.message && /duplicate|unique/i.test(err.message)) {
        throw new Error('Device IMEI is already registered. Please use a different device or login.');
      }
      throw err;
    }
    
    try {
      await traccarService.linkDeviceToUser(traccarUser.id, traccarDevice.id);
    } catch (err) {
      await traccarService.deleteDevice(traccarDevice.id).catch(e => console.error('Rollback cleanup failed:', e));
      await traccarService.deleteUser(traccarUser.id).catch(e => console.error('Rollback cleanup failed:', e));
      throw err;
    }

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          traccarUserId: traccarUser.id,
          emailVerificationToken,
          vehicles: {
            create: [{
              name: vehicleName,
              imei: deviceImei,
              type: vehicleType,
              plate: vehiclePlate,
              traccarDeviceId: traccarDevice.id
            }]
          }
        },
        include: {
          vehicles: true
        }
      });
      // Queue verification email
      await emailQueue.add('SEND_VERIFICATION_EMAIL', { to: email, token: emailVerificationToken });

      res.status(201).json({ 
        message: 'Registration successful. Please verify your email.', 
        user: { id: user.id, email: user.email, name: user.name } 
      });
    } catch (err) {
      await traccarService.deleteDevice(traccarDevice.id).catch(e => console.error('Rollback cleanup failed:', e));
      await traccarService.deleteUser(traccarUser.id).catch(e => console.error('Rollback cleanup failed:', e));
      throw err;
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password, mfaToken, ipAddress, device } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // MFA Check
      if (user.isTotpEnabled) {
        if (!mfaToken) {
          return res.status(200).json({ mfaRequired: true, message: 'MFA token required' });
        }
        // Verification logic (assuming speakeasy)
        const speakeasy = require('speakeasy');
        const verified = speakeasy.totp.verify({
          secret: user.totpSecret,
          encoding: 'base32',
          token: mfaToken
        });
        if (!verified) {
          return res.status(401).json({ error: 'Invalid MFA token' });
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null }
      });

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is locked or suspended' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, traccarUserId: user.traccarUserId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '7d' }
      );

      res.json({ message: 'Login successful', token, role: user.role, traccarUserId: user.traccarUserId });
    } else {
      const attempts = user.failedLoginAttempts + 1;
      let lockUntil = null;
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockUntil }
      });

      res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, device, success: isMatch }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires }
    });

    // Queue reset email
    await emailQueue.add('SEND_RESET_EMAIL', { to: email, token: resetToken });

    res.json({ message: 'Password reset token generated and queued.' });
  } catch (error) {
    res.status(500).json({ error: 'Forgot password failed' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
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
    res.status(500).json({ error: 'Reset password failed' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid verification token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Email verification failed' });
  }
};

exports.setupMFA = async (req, res) => {
  try {
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    const secret = speakeasy.generateSecret({ name: `GeoSurePath (${user.email})` });
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret.base32 }
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrCodeUrl });
  } catch (error) {
    res.status(500).json({ error: 'MFA setup failed' });
  }
};

exports.verifyMFA = async (req, res) => {
  const { token } = req.body;
  try {
    const speakeasy = require('speakeasy');
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

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
    res.status(500).json({ error: 'MFA verification failed' });
  }
};

exports.logout = async (req, res) => {
  // Simple logout (stateless JWT). 
  // Future: Add token to Redis blacklist.
  res.json({ message: 'Logged out successfully' });
};
