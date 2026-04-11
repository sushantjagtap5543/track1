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

const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 3001;

// Autonomic Guards
schemaGuard();
app.use(memoryGuard);

// Observability & Security
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const traccar = require('./src/services/traccar');
const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });

// Status Dashboard
app.get('/api/status', async (req, res) => {
  const status = {
    db: 'unknown',
    redis: 'unknown',
    traccar: 'unknown'
  };

  try { await prisma.$queryRaw`SELECT 1`; status.db = 'UP'; } catch (e) { status.db = 'DOWN'; }
  try { if (await redis.ping() === 'PONG') status.redis = 'UP'; } catch (e) { status.redis = 'DOWN'; }
  try { if (await traccar.checkHealth()) status.traccar = 'UP'; } catch (e) { status.traccar = 'DOWN'; }

  const html = `
    <html>
      <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: white;">
        <h1>GeoSurePath Anti-Gravity Status</h1>
        <div style="display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr);">
          <div style="background: #1e293b; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid ${status.db === 'UP' ? '#22c55e' : '#ef4444'}">
            <h3>Database</h3><p style="font-size: 2rem; color: ${status.db === 'UP' ? '#22c55e' : '#ef4444'}">${status.db}</p>
          </div>
          <div style="background: #1e293b; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid ${status.redis === 'UP' ? '#22c55e' : '#ef4444'}">
            <h3>Redis</h3><p style="font-size: 2rem; color: ${status.redis === 'UP' ? '#22c55e' : '#ef4444'}">${status.redis}</p>
          </div>
          <div style="background: #1e293b; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid ${status.traccar === 'UP' ? '#22c55e' : '#ef4444'}">
            <h3>Traccar</h3><p style="font-size: 2rem; color: ${status.traccar === 'UP' ? '#22c55e' : '#ef4444'}">${status.traccar}</p>
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
