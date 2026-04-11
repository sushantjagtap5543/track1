/**
 * Anti-Gravity Predictive Health Service
 */

const metrics = {
  errors: [],
  latencies: []
};

const recordError = (type) => {
  metrics.errors.push({ type, timestamp: Date.now() });
  // Clean up old metrics (older than 1 hour)
  metrics.errors = metrics.errors.filter(e => e.timestamp > Date.now() - 3600000);
};

const recordLatency = (ms) => {
  metrics.latencies.push({ ms, timestamp: Date.now() });
  metrics.latencies = metrics.latencies.filter(l => l.timestamp > Date.now() - 3600000);
};

const getHealthTrend = () => {
  const errorRate = metrics.errors.length;
  const avgLatency = metrics.latencies.reduce((a, b) => a + b.ms, 0) / (metrics.latencies.length || 1);
  
  if (errorRate > 50 || avgLatency > 2000) return 'UNHEALTHY_TREND';
  if (errorRate > 20 || avgLatency > 1000) return 'DEGRADING';
  return 'OPTIMAL';
};

module.exports = { recordError, recordLatency, getHealthTrend };
