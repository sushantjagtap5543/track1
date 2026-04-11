const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });

/**
 * Intelligent caching service for Anti-Gravity performance.
 */
const cache = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async set(key, value, ttl = 300) { // Default 5 mins
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (e) {
      return false;
    }
  },

  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (e) {
      return false;
    }
  }
};

module.exports = cache;
