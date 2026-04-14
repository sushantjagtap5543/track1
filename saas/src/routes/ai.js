import express from 'express';
import { getGlobalInsights, getVehicleInsights } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * AI Insights Routes
 */
router.get('/insights', authenticateToken, getGlobalInsights);
router.get('/insights/:vehicleId', authenticateToken, getVehicleInsights);

export default router;
