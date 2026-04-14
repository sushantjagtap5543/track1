import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (process.env.NODE_ENV !== 'production') {
      return null; // Stop retrying in development
    }
    return Math.min(times * 50, 2000);
  },
  lazyConnect: true,
});

redisConnection.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!redisConnection.isMockReported) {
      console.log('[GeoSurePath] Redis unavailable for queues. Background workers will be inactive.');
      redisConnection.isMockReported = true;
    }
    return; // Completely silent after first report
  }
  console.error('[GeoSurePath] Redis error:', err);
});

// Create queues with resilience
const createResilientQueue = (name) => {
  const queue = new Queue(name, { connection: redisConnection });
  
  // Wrap add method to handle Redis unavailability
  const originalAdd = queue.add.bind(queue);
  queue.add = async (jobName, data, opts) => {
    try {
      if (redisConnection.status === 'ready') {
        return await originalAdd(jobName, data, opts);
      }
      console.log(`[GeoSurePath] Mock Queue [${name}]: Added job ${jobName}`, data);
      return { id: `mock_${Date.now()}`, data };
    } catch (err) {
      console.warn(`[GeoSurePath] Queue [${name}] error, falling back to mock:`, err.message);
      return { id: `mock_${Date.now()}`, data };
    }
  };
  
  return queue;
};

export const emailQueue = createResilientQueue('EmailQueue');
export const alertQueue = createResilientQueue('AlertQueue');
export const billingQueue = createResilientQueue('BillingQueue');

// Initialize Workers
export const startWorkers = () => {
  if (redisConnection.status !== 'ready' && redisConnection.status !== 'connecting') {
     console.log('[GeoSurePath] Skipping background workers (Redis unavailable).');
     return;
  }
  console.log('[GeoSurePath] Starting background workers...');

  const emailWorker = new Worker('EmailQueue', async job => {
    console.log(`[EmailWorker] Processing job ${job.id}: Sending email to ${job.data.to}`);
    // Nodemailer logic here
    // ...
  }, { connection: redisConnection });

  const alertWorker = new Worker('AlertQueue', async job => {
    console.log(`[AlertWorker] Processing alert: ${job.data.type} for device ${job.data.deviceId}`);
    // Alert rules logic (Geofence, Ignition, Safe Parking)
    // Send to WhatsApp / Email
    // ...
  }, { connection: redisConnection });

  const billingWorker = new Worker('BillingQueue', async job => {
    console.log(`[BillingWorker] Processing billing check for user ${job.data.userId}`);
    // Subscription suspension logic
    // ...
  }, { connection: redisConnection });

  // Event listeners for workers
  emailWorker.on('completed', job => console.log(`[EmailWorker] Job ${job.id} completed.`));
  emailWorker.on('failed', (job, err) => console.error(`[EmailWorker] Job ${job.id} failed:`, err));
};
