import Redis from 'ioredis';
const redis = new Redis({ 
  host: process.env.REDIS_HOST || 'redis',
  retryStrategy: (times) => (times > 3) ? null : Math.min(times * 50, 2000)
});
redis.on('error', () => {}); // Silence errors

const advancedCache = {
  async getOrFetch(key, fetcher, ttl = 300) {
    let cached = null;
    try {
      if (redis.status === 'ready') {
        const data = await redis.get(key);
        if (data) cached = JSON.parse(data);
      }
    } catch (e) {}

    if (cached) return cached;
    const fresh = await fetcher();
    if (fresh && redis.status === 'ready') {
      try { await redis.set(key, JSON.stringify(fresh), 'EX', ttl); } catch (e) {}
    }
    return fresh;
  },

  async updateAndCache(key, value, updater, ttl = 300) {
    const result = await updater();
    if (redis.status === 'ready') {
      try { await redis.set(key, JSON.stringify(value), 'EX', ttl); } catch (e) {}
    }
    return result;
  }
};

export default advancedCache;
