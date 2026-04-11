const rateLimit = require('express-rate-limit');
const { getHealthTrend } = require('../services/predictiveHealth');

/**
 * Anti-Gravity Dynamic Throttle
 * Adjusts rate limits based on system health trends.
 */
const dynamicThrottle = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    const trend = getHealthTrend();
    if (trend === 'UNHEALTHY_TREND') return 20; // Tighten
    if (trend === 'DEGRADING') return 50;
    return 100; // Normal
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests. System is currently shielding resources for stability.'
  }
});

module.exports = dynamicThrottle;
