const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });

/**
 * Advanced Caching Service
 * Implements Cache-Aside and Write-Through patterns.
 */
const advancedCache = {
  /**
   * Cache-Aside Pattern
   */
  async getOrFetch(key, fetcher, ttl = 300) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const fresh = await fetcher();
    if (fresh) {
      await redis.set(key, JSON.stringify(fresh), 'EX', ttl);
    }
    return fresh;
  },

  /**
   * Write-Through Property
   */
  async updateAndCache(key, value, updater, ttl = 300) {
    const result = await updater();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    return result;
  }
};

module.exports = advancedCache;
