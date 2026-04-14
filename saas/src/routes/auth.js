import express from 'express';
import { register, login, forgotPassword, resetPassword, verifyEmail, setupMFA, verifyMFA, logout } from '../controllers/authController.js';

const router = express.Router();

// Registration
router.post('/register', register);

// Secure Login
router.post('/login', login);

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Reset Password
router.post('/reset-password', resetPassword);

// Verify Email
router.get('/verify-email/:token', verifyEmail);

// MFA Setup
router.post('/mfa/setup', setupMFA);

// MFA Verify
router.post('/mfa/verify', verifyMFA);

// Logout
router.post('/logout', logout);

export default router;
