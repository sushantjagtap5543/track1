// src/services/edgeIntelligence.js

/**
 * Edge Intelligence Service
 * Simulates intelligence at the edge/gateway level.
 * Features: Data deduplication, Outlier detection, Priority flagging.
 */

const processEdgeData = (payload) => {
  const { latitude, longitude, speed, attributes } = payload;
  
  // 1. Basic Outlier Detection (Self-healing logic)
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { status: 'rejected', reason: 'Geospatial outlier detected' };
  }

  // 2. Priority Flagging (Urgent vs Normal)
  let priority = 'NORMAL';
  if (attributes?.alarm || speed > 120) {
    priority = 'HIGH';
  }

  // 3. Compression/Optimization (Simulation)
  const optimizedPayload = {
    ...payload,
    processedAt: new Date().toISOString(),
    priority,
    intelligenceVersion: '1.0.0-anti-gravity'
  };

  return { status: 'accepted', data: optimizedPayload };
};

module.exports = {
  processEdgeData
};
