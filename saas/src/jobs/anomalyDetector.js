import { getHealthTrend, recordError } from '../services/predictiveHealth.js';

/**
 * Anti-Gravity Autonomous Anomaly Detector
 * Monitors metric baselines and triggers alerts for silent failures.
 */

const detectAnomalies = () => {
  console.log('[AnomalyDetector] Scanning system baselines...');
  
  const trend = getHealthTrend();
  
  // Hypothetical logic: If health is UNHEALTHY but no hard errors are logged, it's a silent failure.
  if (trend === 'UNHEALTHY_TREND') {
    console.error('[ANOMALY] Silent degradation detected. System performing poorly without explicit crash logs.');
    recordError('SILENT_ANOMALY');
  } else {
    console.log(`[AnomalyDetector] System baseline: ${trend}. No anomalies detected.`);
  }
};

// Run every 10 minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(detectAnomalies, 10 * 60 * 1000);
}

export default detectAnomalies;
