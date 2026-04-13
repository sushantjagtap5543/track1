// src/controllers/webhookController.js
const { PrismaClient } = require('@prisma/client');
const { Worker } = require('worker_threads');
const path = require('path');
const edgeIntelligence = require('../services/edgeIntelligence');
const prisma = new PrismaClient();

/**
 * Traccar Webhook Controller
 * Receives position data, signs it via cryptoWorker, and stores it immutably.
 */
const handleTraccarWebhook = async (req, res) => {
  const webhookSecret = req.headers['x-traccar-secret'];
  if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized webhook request' });
  }

  try {
    const { deviceId, latitude, longitude, deviceTime, attributes } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required position fields' });
    }

    // 1. Edge Intelligence Pre-processing
    const edgeResult = edgeIntelligence.processEdgeData({ deviceId, latitude, longitude, speed, attributes });
    if (edgeResult.status === 'rejected') {
      console.warn(`[Edge] Rejected data for device ${deviceId}: ${edgeResult.reason}`);
      return res.status(422).json({ error: edgeResult.reason });
    }

    const { data: processedData } = edgeResult;

    // 2. Offload signing to Crypto Worker
    const worker = new Worker(path.join(__dirname, '../workers/cryptoWorker.js'), {
      workerData: {
        action: 'signPosition',
        payload: processedData
      }
    });

    worker.on('message', async (message) => {
      if (message.status === 'done') {
        const { signature, hash } = message.result;

        // Store in DB
        const signedPosition = await prisma.signedPosition.create({
          data: {
            deviceId: parseInt(deviceId),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            timestamp: new Date(deviceTime || Date.now()),
            signature,
            hash
          }
        });

        console.log(`[Blockchain] Position signed and stored for device ${deviceId}`);
        res.status(201).json({ status: 'success', id: signedPosition.id });
      }
    });

    worker.on('error', (err) => {
      console.error('[CryptoWorker Error]', err);
      res.status(500).json({ error: 'Signing failed' });
    });

  } catch (error) {
    console.error('[Webhook Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  handleTraccarWebhook
};
