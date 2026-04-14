import express from 'express';
import { getSystemHealth, getStats, updateClientStatus, getFailedLogins, forcePasswordReset, deleteUser, runIntegrityAudit, updatePricing } from '../controllers/adminController.js';
import ComplianceController from '../controllers/ComplianceController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
// Ensure all routes below belong to ADMIN only
router.use(requireRole('ADMIN'));

router.get('/health', getSystemHealth);
router.get('/stats', getStats);
router.post('/client-status', updateClientStatus);
router.get('/failed-logins', getFailedLogins);
router.post('/force-password-reset', forcePasswordReset);

// Delete client (Soft Delete)
router.delete('/client', deleteUser);
router.get('/integrity-audit', runIntegrityAudit);
router.post('/compliance-scan', ComplianceController.triggerDeepScan);
router.get('/compliance-status', ComplianceController.getComplianceStatus);
router.post('/update-pricing', updatePricing);

export default router;

