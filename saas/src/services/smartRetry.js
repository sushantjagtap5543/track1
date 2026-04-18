import { getHealthTrend } from './predictiveHealth.js';

/**
 * Anti-Gravity Smart Retry Service
 * Dynamically adjusts retry parameters based on system health.
 */

const smartRetry = async (fn, options = {}) => {
  const trend = getHealthTrend();
  
  // Decide budget based on health
  let maxRetries = options.maxRetries || (trend === 'OPTIMAL' ? 3 : (trend === 'DEGRADING' ? 1 : 0));
  let baseDelay = options.baseDelay || 1000;
  
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      attempt++;
      
      // Jittered exponential backoff
      const delay = Math.min(10000, baseDelay * Math.pow(2, attempt) + Math.random() * 1000);
      console.log(`[SmartRetry] Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms... (Trend: ${trend})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default smartRetry;
