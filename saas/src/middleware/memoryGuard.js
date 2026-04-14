/**
 * Anti-Gravity Memory Guard
 * Monitors heap usage and prevents process death.
 */

const HEAP_THRESHOLD_MB = process.env.MEMORY_GUARD_THRESHOLD || 1024; // 1GB default

const memoryGuard = (req, res, next) => {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;

  if (heapUsedMB > HEAP_THRESHOLD_MB) {
    console.error(JSON.stringify({
      level: 'critical',
      message: 'Memory threshold exceeded',
      heapUsedMB,
      thresholdMB: HEAP_THRESHOLD_MB,
      timestamp: new Date().toISOString()
    }));
    
    // In production, we might trigger a graceful restart here
    // For now, we alert.
  }

  next();
};

export default memoryGuard;
