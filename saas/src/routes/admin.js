// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const ComplianceController = require('../controllers/ComplianceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
// Ensure all routes below belong to ADMIN only
router.use(requireRole('ADMIN'));

router.get('/health', adminController.getSystemHealth);
router.get('/stats', adminController.getStats);
router.post('/client-status', adminController.updateClientStatus);
router.get('/failed-logins', adminController.getFailedLogins);
router.post('/force-password-reset', adminController.forcePasswordReset);

// Delete client (Soft Delete)
router.delete('/client', adminController.deleteUser);
router.get('/integrity-audit', adminController.runIntegrityAudit);
router.post('/compliance-scan', ComplianceController.triggerDeepScan);
router.get('/compliance-status', ComplianceController.getComplianceStatus);

module.exports = router;

