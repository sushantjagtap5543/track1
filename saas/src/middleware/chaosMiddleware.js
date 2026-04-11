/**
 * Anti-Gravity Chaos Middleware
 * Controlled fault injection for resilience testing.
 */

const chaosMiddleware = (req, res, next) => {
  const CHAOS_LEVEL = parseFloat(process.env.CHAOS_LEVEL) || 0; // 0 to 1

  if (Math.random() < CHAOS_LEVEL) {
    const dice = Math.random();
    
    // 50% chance of latency
    if (dice < 0.5) {
      const latency = Math.floor(Math.random() * 2000) + 1000; // 1-3s
      console.log(`[CHAOS] Injecting ${latency}ms latency to ${req.path}`);
      return setTimeout(next, latency);
    } 
    
    // 50% chance of failure (400, 500, 503)
    const stats = [400, 500, 503];
    const status = stats[Math.floor(Math.random() * stats.length)];
    console.log(`[CHAOS] Injecting ${status} error to ${req.path}`);
    return res.status(status).json({ message: 'Chaos Monkey says NO.' });
  }

  next();
};

module.exports = chaosMiddleware;
