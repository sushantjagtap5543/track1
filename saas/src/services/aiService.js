// saas/src/services/aiService.js

/**
 * AI Service for GeoSurePath
 * Handles predictive maintenance, anomaly detection, and sensory sensitivity logic.
 */

/**
 * Predicts next maintenance date based on mileage and usage patterns.
 * @param {Object} vehicle - Vehicle object from DB
 * @param {Array} history - Recent positions/trips
 * @returns {Date} Predicted maintenance date
 */
const predictMaintenance = (vehicle, history) => {
    // Basic logic: Maintenance every 5000 km
    const maintenanceInterval = 5000;
    const currentMileage = vehicle.mileage || 0;
    const lastMaintenanceMileage = vehicle.lastMaintenanceMileage || 0;
    
    const mileageSinceMaintenance = currentMileage - lastMaintenanceMileage;
    const remainingMileage = Math.max(0, maintenanceInterval - mileageSinceMaintenance);
    
    // Estimate daily mileage from history (simulated)
    const dailyAverage = 50; // default 50km/day
    const daysToNext = remainingMileage / dailyAverage;
    
    const predictionDate = new Date();
    predictionDate.setDate(predictionDate.getDate() + daysToNext);
    
    return predictionDate;
};

/**
 * Detects anomalies in sensor data (e.g., fuel drop, unusual vibrations)
 * @param {Object} position - Latest position with attributes
 * @returns {Object|null} Anomaly report or null
 */
const detectAnomalies = (position) => {
    const { attributes } = position;
    if (!attributes) return null;

    const reports = [];

    // Fuel Drop Anomaly
    if (attributes.fuel && attributes.fuel < 10) {
        reports.push({ type: 'LOW_FUEL', priority: 'HIGH', message: 'Critical fuel level detected.' });
    }

    // Unusual Vibration (if safe parking is on and sensitivity is high)
    if (attributes.vibration > 7) {
        reports.push({ type: 'TAMPER_ALERT', priority: 'CRITICAL', message: 'Unusual vibration detected while parked.' });
    }

    return reports.length > 0 ? reports : null;
};

/**
 * Calculates sensor sensitivity level based on Safe Parking status
 * @param {boolean} isSafeParkingEnabled 
 * @returns {number} Sensitivity level (1-10)
 */
const getRequiredSensitivity = (isSafeParkingEnabled) => {
    return isSafeParkingEnabled ? 9 : 3; // Increase to 9 when safe parking, else default 3
};

module.exports = {
    predictMaintenance,
    detectAnomalies,
    getRequiredSensitivity
};
