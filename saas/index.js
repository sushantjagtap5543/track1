require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { startWorkers } = require('./src/services/queue');
const errorHandler = require('./src/middleware/errorMiddleware');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const { metricsMiddleware, register } = require('./src/middleware/metricsMiddleware');
const correlationIdMiddleware = require('./src/middleware/correlationIdMiddleware');

const memoryGuard = require('./src/middleware/memoryGuard');
const schemaGuard = require('./src/middleware/schemaGuard');

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;");
  next();
};

const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 3001;

// Autonomic Guards
schemaGuard();
app.use(memoryGuard);
app.use(securityHeaders);

// Observability & Security
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many login or reset attempts, please try again later'
});

app.use(limiter);
app.use('/api/auth', authLimiter);

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const traccar = require('./src/services/traccar');

// Anti-Gravity Redis Mock for Local Recovery
let redis;
try {
  const Redis = require('ioredis');
  redis = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', retryStrategy: () => null });
  redis.on('error', (err) => {
    console.log('[INFO] Redis not available, using mock mode.');
    redis = { 
      ping: () => Promise.resolve('PONG'), 
      on: () => {}, 
      add: () => Promise.resolve(),
      isMock: true 
    };
  });
} catch (e) {
  redis = { 
    ping: () => Promise.resolve('PONG'), 
    on: () => {}, 
    add: () => Promise.resolve(),
    isMock: true 
  };
}

// Status Dashboard
app.get('/api/status', async (req, res) => {
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
  try { if (await traccar.checkHealth()) status.traccar = process.env.MOCK_TRACCAR === 'true' ? 'MOCK' : 'UP'; } catch (e) { status.traccar = 'DOWN'; }

  const html = `
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
  res.send(html);
});

// Main entry point
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GeoSurePath SaaS API is running.' });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/vehicles', require('./src/routes/vehicles'));
app.use('/api/billing', require('./src/routes/billing'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/webhooks', require('./src/routes/webhooks'));
app.use('/api/ai', require('./src/routes/ai'));

// Use Global Error Handler
app.use(errorHandler);

const redact = require('./src/utils/redactor');

const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify(redact({ level: 'info', message: msg, ...meta, timestamp: new Date().toISOString() }))),
  error: (msg, meta = {}) => console.error(JSON.stringify(redact({ level: 'error', message: msg, ...meta, timestamp: new Date().toISOString() })))
};

// Start background workers
startWorkers();

const server = app.listen(PORT, () => {
  logger.info('Server is running', { port: PORT });
});

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
