/**
 * Anti-Gravity Universal Semantic Telemetry Tags
 * Enriches system logs with AI-readable intent context.
 */

const tags = {
    RELIABILITY_VALIDATION: 'INTENT_RV',
    SECURITY_PROBE: 'INTENT_SP',
    PERFORMANCE_TUNING: 'INTENT_PT',
    FLIGHT_FIDELITY_FAILURE: 'INTENT_FFF'
};

const annotate = (log, intent) => {
    const tag = tags[intent] || 'INTENT_UNKNOWN';
    return {
        ...log,
        semanticIntent: tag,
        machineTimestamp: Date.now()
    };
};

module.exports = annotate;
