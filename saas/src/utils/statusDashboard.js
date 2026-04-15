import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import traccar from '../services/traccar.js';

const prisma = new PrismaClient();

// Redis setup for status check
let redis;
try {
  redis = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', retryStrategy: () => null });
  redis.on('error', (err) => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CRITICAL] Redis connection failed in production:', err.message);
    }
    if (!redis.isMock) {
      console.log('[INFO] Redis not available, using mock mode.');
      redis.isMock = true;
    }
  });
} catch (e) {
  redis = { isMock: true };
}

export const getStatusHtml = async () => {
  const status = {
    db: 'unknown',
    redis: 'unknown',
    traccar: 'unknown'
  };

  try { await prisma.$queryRaw`SELECT 1`; status.db = 'UP'; } catch (e) { status.db = 'DOWN'; }
  try { 
    if (redis.isMock) {
      status.redis = 'MOCK (RECOVERY MODE)';
    } else if (await redis.ping() === 'PONG') {
      status.redis = 'UP'; 
    }
  } catch (e) { status.redis = 'DOWN'; }
  try { 
    const isHealthy = await traccar.checkHealth();
    if (!isHealthy && process.env.NODE_ENV !== 'production' && process.env.MOCK_TRACCAR !== 'true') {
      console.warn('[GeoSurePath] Traccar engine unreachable. Enabling Dynamic Mock Mode for local stability.');
      process.env.MOCK_TRACCAR = 'true';
    }
    status.traccar = process.env.MOCK_TRACCAR === 'true' ? (isHealthy ? 'MOCK (ENGINE UP)' : 'MOCK (DYNAMIC FALLBACK)') : 'UP'; 
  } catch (e) { status.traccar = 'DOWN'; }

  const template = `
    <html>
      <head>
        <title>GeoSurePath | Anti-Gravity Status</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
          .container { max-width: 1000px; margin: 0 auto; }
          .card { background: #1e293b; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #334155; margin-bottom: 1rem; }
          .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          .status-up { color: #22c55e; font-weight: bold; }
          .status-down { color: #ef4444; font-weight: bold; }
          h1 { color: #38bdf8; font-size: 2.5rem; margin-bottom: 0.5rem; }
          .ai-insight { background: #1e1b4b; border-color: #4338ca; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>GeoSurePath <span style="font-weight: 300;">Anti-Gravity</span></h1>
          <p>System Recovery Mode | Comprehensive Dashboard</p>
          
          <div class="card status-grid">
            <div><h3>Database</h3><p class="${status.db === 'UP' ? 'status-up' : 'status-down'}">${status.db}</p></div>
            <div><h3>Redis</h3><p class="${status.redis === 'UP' ? 'status-up' : 'status-down'}">${status.redis}</p></div>
            <div><h3>Traccar</h3><p class="${status.traccar === 'UP' ? 'status-up' : 'status-down'}">${status.traccar}</p></div>
          </div>

          <div class="card ai-insight">
            <h3>GeoSure AI Status</h3>
            <p>AI Insights Engine is ${process.env.OPENROUTER_API_KEY ? 'CONFIGURED' : 'UNCONFIGURED'}.</p>
            <p style="font-size: 0.85rem; color: #94a3b8;">Using model: ${process.env.OPENROUTER_MODEL || 'default'}</p>
          </div>

          <div class="card">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/api/health" style="color: #38bdf8;">Health Check</a></li>
              <li><a href="/api-docs" style="color: #38bdf8;">API Documentation</a></li>
              <li><a href="/metrics" style="color: #38bdf8;">Prometheus Metrics</a></li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `;

  return template;
};
