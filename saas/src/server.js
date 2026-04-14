import 'dotenv/config';
import app, { prisma } from './app.js';
import { startWorkers } from './services/queue.js';
import backupDriveService from './services/backupDriveService.js';
import { startSelfHealingJob } from './services/selfHealing.js';
import { startArchivalJob } from './jobs/archiveJob.js';
import schemaGuard from './middleware/schemaGuard.js';
import redact from './utils/redactor.js';
import { initSocket } from './services/socketService.js';
import { startTraccarBridge } from './services/traccarBridge.js';
import { WebSocketServer } from 'ws';

import { getMockPositions, moveMockPositions } from './services/mockState.js';

const PORT = process.env.PORT || 3001;
const logger = {
  info: (msg, meta = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(redact({ level: 'info', message: msg, ...meta, timestamp: new Date().toISOString() })));
    } else {
      console.log(`[GeoSure INFO] ${msg}`, meta);
    }
  },
  error: (msg, meta = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(redact({ level: 'error', message: msg, ...meta, timestamp: new Date().toISOString() })));
    } else {
      console.error(`[GeoSure ERROR] ${msg}`, meta);
    }
  }
};

// Autonomic Guards
schemaGuard();

// Start background services (Commented out for initial production hardening)
// startWorkers();
// backupDriveService.startAutomatedSchedule();
// startSelfHealingJob();
startArchivalJob();

const server = app.listen(PORT, () => {
  logger.info('Server is running', { port: PORT });
});

// Initialize WebSocket Layer
initSocket(server);

// Mock Traccar Native WebSocket
if (process.env.MOCK_TRACCAR === 'true') {
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/api/socket') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  setInterval(() => {
    moveMockPositions();
    const message = { positions: getMockPositions() };
    if (Math.random() > 0.8) {
      message.events = [{
        id: Date.now(),
        deviceId: Math.floor(Math.random() * 25) + 1,
        type: ['sos', 'overspeed', 'ignitionOn', 'alarm'][Math.floor(Math.random() * 4)],
        eventTime: new Date().toISOString(),
        attributes: {}
      }];
    }
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  }, 3000);

  wss.on('connection', (ws) => {
    console.log('[Native WS] Frontend connected to Mock Traccar WebSocket');
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ positions: getMockPositions() }));
    }
    ws.on('close', () => {
       console.log('[Native WS] Frontend disconnected');
    });
  });
}

// Start Traccar Real-time Bridge
startTraccarBridge();

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info('Received shutdown signal', { signal });
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
