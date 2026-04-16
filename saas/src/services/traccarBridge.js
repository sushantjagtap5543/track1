import prisma from '../utils/prisma.js';
import { WebSocket } from 'ws';
import { broadcastLocation, broadcastEvent } from './socketService.js';

const TRACCAR_WS_URL = process.env.TRACCAR_URL ? process.env.TRACCAR_URL.replace('http', 'ws') + '/api/socket' : null;

/**
 * Starts the bridge between Traccar WebSocket and SaaS Socket.io.
 */
export const startTraccarBridge = () => {
  if (!TRACCAR_WS_URL || process.env.MOCK_TRACCAR === 'true') {
    console.log('[Traccar Bridge] Missing TRACCAR_URL or in MOCK mode. Bridge not started.');
    return;
  }

  const email = process.env.TRACCAR_ADMIN_EMAIL || 'admin';
  const password = process.env.TRACCAR_ADMIN_PASSWORD || 'admin';
  const auth = Buffer.from(`${email}:${password}`).toString('base64');

  const connect = () => {
    const ws = new WebSocket(TRACCAR_WS_URL, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    ws.on('open', () => {
      console.log('[Traccar Bridge] Connected to Traccar WebSocket');
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);

        if (message.positions) {
          for (const pos of message.positions) {
             const vehicle = await prisma.vehicle.findUnique({
               where: { traccarDeviceId: pos.deviceId },
               select: { userId: true }
             });
             if (vehicle) {
               broadcastLocation(vehicle.userId, pos);
             }
          }
        }

        if (message.events) {
          for (const event of message.events) {
            const vehicle = await prisma.vehicle.findUnique({
              where: { traccarDeviceId: event.deviceId },
              select: { userId: true }
            });
            if (vehicle) {
              broadcastEvent(vehicle.userId, event);
            }
          }
        }
      } catch (err) {
        console.error('[Traccar Bridge] Error processing message:', err.message);
      }
    });

    ws.on('error', (err) => {
      console.error('[Traccar Bridge] WebSocket error:', err.message);
    });

    ws.on('close', () => {
      console.warn('[Traccar Bridge] WebSocket closed. Reconnecting in 5s...');
      setTimeout(connect, 5000);
    });
  };

  connect();
};

export default {
  startTraccarBridge
};
