/**
 * GeoSurePath Health-Check Utility
 * Verifies connectivity to Database, Redis, and Traccar API.
 */
require('dotenv').config({ path: __dirname + '/../saas/.env' });
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const traccar = require('../saas/src/services/traccar');

async function checkHealth() {
  console.log('--- GeoSurePath System Health Check ---');
  
  // 1. Database Check
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('[OK] Database: Connected (PostgreSQL)');
  } catch (err) {
    console.error('[FAIL] Database:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Redis Check
  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: () => null
  });
  try {
    const pong = await redis.ping();
    console.log(`[OK] Redis: Connected (${pong})`);
  } catch (err) {
    console.error('[FAIL] Redis:', err.message);
  } finally {
    redis.disconnect();
  }

  // 3. Traccar API Check
  try {
    const isHealthy = await traccar.checkHealth();
    if (isHealthy) {
      console.log('[OK] Traccar API: Reachable');
    } else {
      console.error('[FAIL] Traccar API: Not reachable or returned error status');
    }
  } catch (err) {
    console.error('[FAIL] Traccar API:', err.message);
  }

  console.log('---------------------------------------');
}

checkHealth().catch(err => {
  console.error('Fatal error during health check:', err);
  process.exit(1);
});
