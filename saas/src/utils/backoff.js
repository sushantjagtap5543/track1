/**
 * Anti-Gravity Jittered Exponential Backoff
 */

const backoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      
      const delay = Math.min(
        10000, // Max 10 seconds
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = backoff;
