// src/controllers/webhookController.js
const { PrismaClient } = require('@prisma/client');
const { Worker } = require('worker_threads');
const path = require('path');
const prisma = new PrismaClient();

/**
 * Traccar Webhook Controller
 * Receives position data, signs it via cryptoWorker, and stores it immutably.
 */
const handleTraccarWebhook = async (req, res) => {
  try {
    const { deviceId, latitude, longitude, deviceTime, attributes } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required position fields' });
    }

    // Offload signing to Crypto Worker
    const worker = new Worker(path.join(__dirname, '../workers/cryptoWorker.js'), {
      workerData: {
        action: 'signPosition',
        payload: { deviceId, latitude, longitude, deviceTime, attributes }
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
