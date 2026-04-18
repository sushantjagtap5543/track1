import express from 'express';
import { register, login, forgotPassword, resetPassword, verifyEmail, setupMFA, verifyMFA, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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

// MFA Setup (Protected)
router.post('/mfa/setup', authenticateToken, setupMFA);

// MFA Verify (Protected)
router.post('/mfa/verify', authenticateToken, verifyMFA);

// Logout (Protected)
router.post('/logout', authenticateToken, logout);

export default router;
