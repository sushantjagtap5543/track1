import Redis from 'ioredis';

const redis = new Redis({ 
  host: process.env.REDIS_HOST || 'redis',
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('[GeoSurePath] Redis unavailable. Falling back to in-memory cache.');
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  }
});

// Suppress unhandled error events
redis.on('error', (err) => {
  // Silence connection refused errors in local dev
});

// In-memory fallback
const memoryCache = new Map();

/**
 * Intelligent caching service for Anti-Gravity performance.
 */
const cache = {
  async get(key) {
    try {
      if (redis.status === 'ready') {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      }
      return memoryCache.get(key) || null;
    } catch (e) {
      return memoryCache.get(key) || null;
    }
  },

  async set(key, value, ttl = 300) { // Default 5 mins
    try {
      if (redis.status === 'ready') {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
      }
      memoryCache.set(key, value);
      setTimeout(() => memoryCache.delete(key), ttl * 1000);
      return true;
    } catch (e) {
      memoryCache.set(key, value);
      return true;
    }
  },

  async del(key) {
    try {
      if (redis.status === 'ready') {
        await redis.del(key);
      }
      memoryCache.delete(key);
      return true;
    } catch (e) {
      memoryCache.delete(key);
      return true;
    }
  }
};

export default cache;
