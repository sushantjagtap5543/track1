// saas/src/routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * AI Insights Routes
 */
router.get('/insights', authenticateToken, aiController.getGlobalInsights);
router.get('/insights/:vehicleId', authenticateToken, aiController.getVehicleInsights);

module.exports = router;
