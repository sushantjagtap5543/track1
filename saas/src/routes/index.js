import express from 'express';
import authRoutes from './auth.js';
import vehicleRoutes from './vehicles.js';
import billingRoutes from './billing.js';
import adminRoutes from './admin.js';
import reportRoutes from './reports.js';
import webhookRoutes from './webhooks.js';
import aiRoutes from './ai.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/devices', vehicleRoutes); // Alias for Traccar UI compatibility
router.use('/billing', billingRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/ai', aiRoutes);

export default router;
