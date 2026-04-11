// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const traccarService = require('../services/traccar');
const { emailQueue } = require('../services/queue');

// Use global singleton if possible, or ensure it uses env URL
const prisma = new PrismaClient();

/**
 * Helper for input validation
 * @param {string[]} fields 
 * @param {Object} data 
 * @returns {Object} { valid: boolean, error: string }
 */
const validateInput = (fields, data) => {
  for (const field of fields) {
    if (!data[field]) return { valid: false, error: `${field} is required` };
  }
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return { valid: false, error: 'Invalid email format' };
  if (data.password && data.password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  return { valid: true };
};

exports.register = async (req, res, next) => {
  try {
    const validation = validateInput(['name', 'email', 'password', 'vehicleName', 'deviceImei'], req.body);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const { name, email, phone, password, vehicleName, vehicleType, vehiclePlate, deviceImei } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Stronger salt rounds
    
    // Traccar Integration
    let traccarUser;
    try {
      traccarUser = await traccarService.createUser(name, email, password);
    } catch (err) {
      if (err.message && /duplicate|unique/i.test(err.message)) {
        return res.status(400).json({ error: 'Email is already registered in Traccar system.' });
      }
      throw err;
    }
    
    let traccarDevice;
    try {
      traccarDevice = await traccarService.createDevice(vehicleName, deviceImei);
    } catch (err) {
      await traccarService.deleteUser(traccarUser.id).catch(e => console.error('Rollback cleanup failed:', e));
      if (err.message && /duplicate|unique/i.test(err.message)) {
        return res.status(400).json({ error: 'Device IMEI is already registered.' });
      }
      throw err;
    }
    try {
      await traccarService.linkDeviceToUser(traccarUser.id, traccarDevice.id);
    } catch (err) {
      // Robust Rollback Saga
      console.error('Registration failed at linking stage. Rolling back...', err);
      if (traccarDevice && traccarDevice.id) {
        await traccarService.deleteDevice(traccarDevice.id).catch(e => console.error('Rollback: Failed to delete device:', e));
      }
      if (traccarUser && traccarUser.id) {
        await traccarService.deleteUser(traccarUser.id).catch(e => console.error('Rollback: Failed to delete user:', e));
      }
      throw err;
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        traccarUserId: traccarUser.id,
        emailVerificationToken,
        emailVerificationExpires: verificationExpires,
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
      include: { vehicles: true }
    });

    await emailQueue.add('SEND_VERIFICATION_EMAIL', { to: email, token: emailVerificationToken });

    res.status(201).json({ 
      message: 'Registration successful. Please verify your email.', 
      user: { id: user.id, email: user.email, name: user.name } 
    });

  } catch (error) {
    next(error); // Use global error handler
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, mfaToken, ipAddress, device } = req.body;
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

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null }
      });

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is locked or suspended' });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, traccarUserId: user.traccarUserId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '7d' }
      );

      res.json({ message: 'Login successful', token, role: user.role, traccarUserId: user.traccarUserId });
    } else {
      const attempts = user.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

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
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'If an account exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashedResetToken, resetPasswordExpires: resetExpires }
    });

    await emailQueue.add('SEND_RESET_EMAIL', { to: email, token: resetToken });

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
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

exports.verifyEmail = async (req, res, next) => {
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

exports.setupMFA = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const secret = speakeasy.generateSecret({ name: `GeoSurePath (${user.email})` });
    
    // Store temporarily in memory or a cache if possible, 
    // here we store in DB but not enabled yet.
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

exports.verifyMFA = async (req, res, next) => {
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

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
