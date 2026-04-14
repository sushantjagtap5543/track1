import express from 'express';
import { createOrder, verifyPayment, getSubscription, getPayments } from '../controllers/billingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Create order for Razorpay checkout
router.post('/create-order', createOrder);

// Verify payment
router.post('/verify', verifyPayment);

// Get current subscription
router.get('/subscription', getSubscription);

// Get payment history
router.get('/history', getPayments);

export default router;
