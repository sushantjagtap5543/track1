// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration (Step 1, 2, 3 combined into one payload)
router.post('/register', authController.register);

// Secure Login
router.post('/login', authController.login);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password', authController.resetPassword);

// Verify Email
router.get('/verify-email/:token', authController.verifyEmail);

// MFA Setup
router.post('/mfa/setup', authController.setupMFA);

// MFA Verify
router.post('/mfa/verify', authController.verifyMFA);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
