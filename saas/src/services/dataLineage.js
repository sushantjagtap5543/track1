/**
 * Anti-Gravity Universal Data Lineage Registry
 * Tracks data lifecycle from IoT ingestion to API delivery.
 */

const registry = [];

const logLineage = (dataId, source, operation) => {
    const entry = {
        dataId,
        source,
        operation,
        timestamp: new Date().toISOString()
    };
    registry.push(entry);
    console.log(`[DataLineage] Registered: ${operation} on ${dataId} from ${source}`);
    
    // Maintain rolling buffer of 10k entries
    if (registry.length > 10000) registry.shift();
};

const getLineage = (dataId) => {
    return registry.filter(e => e.dataId === dataId);
};

module.exports = { logLineage, getLineage };
