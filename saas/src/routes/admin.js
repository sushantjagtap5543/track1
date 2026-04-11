// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
// Ensure all routes below belong to ADMIN only
router.use(requireRole('ADMIN'));

router.get('/health', adminController.getSystemHealth);
router.get('/stats', adminController.getStats);
router.post('/client-status', adminController.updateClientStatus);
router.get('/failed-logins', adminController.getFailedLogins);
router.post('/force-password-reset', adminController.forcePasswordReset);

module.exports = router;

