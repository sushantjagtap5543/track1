// src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * Public Webhook for Traccar
 * In production, this should be secured via IP whitelisting or a shared secret.
 */
router.post('/traccar', webhookController.handleTraccarWebhook);

module.exports = router;
