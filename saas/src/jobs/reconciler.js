const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });

/**
 * Anti-Gravity State Reconciler
 * Ensures consistency between Distributed Cache and Database.
 */

const reconcileState = async () => {
    console.log('[Reconciler] Synchronizing distributed state...');
    
    // Example: Check if device count in Redis matches DB
    const dbCount = await prisma.vehicle.count();
    const cacheCount = await redis.get('global:device_count');
    
    if (cacheCount && parseInt(cacheCount) !== dbCount) {
        console.warn(`[RECONCILE] State drift detected! DB: ${dbCount} | Cache: ${cacheCount}. Re-syncing...`);
        await redis.set('global:device_count', dbCount);
    } else {
        console.log('[Reconciler] State perfectly synchronized.');
    }
};

// Run every 30 minutes
setInterval(reconcileState, 30 * 60 * 1000);

module.exports = reconcileState;
