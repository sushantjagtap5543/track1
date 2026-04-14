// src/controllers/webhookController.js
import { PrismaClient } from '@prisma/client';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import edgeIntelligence from '../services/edgeIntelligence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Traccar Webhook Controller
 * Receives position data, signs it via cryptoWorker, and stores it immutably.
 */
export const handleTraccarWebhook = async (req, res) => {
  const webhookSecret = req.headers['x-traccar-secret'];
  const configuredSecret = process.env.WEBHOOK_SECRET;

  if (!configuredSecret) {
    console.error('[CRITICAL] WEBHOOK_SECRET is not configured in environment variables. Rejecting all requests for safety.');
    return res.status(500).json({ error: 'Webhook configuration error' });
  }

  if (webhookSecret !== configuredSecret) {
    return res.status(401).json({ error: 'Unauthorized webhook request' });
  }

  try {
    const { deviceId, latitude, longitude, speed, deviceTime, attributes } = req.body;

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
