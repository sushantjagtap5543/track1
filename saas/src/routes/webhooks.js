import express from 'express';
import { handleTraccarWebhook } from '../controllers/webhookController.js';

const router = express.Router();

/**
 * Public Webhook for Traccar
 * In production, this should be secured via IP whitelisting or a shared secret.
 */
router.post('/traccar', handleTraccarWebhook);

export default router;
