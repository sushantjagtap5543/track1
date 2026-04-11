/**
 * Anti-Gravity Circuit Breaker Dashboard
 * Manages the state of all system-wide circuit breakers.
 */

const breakers = {
    TRACCAR_API: { state: 'CLOSED', failures: 0, lastFailure: null },
    DATABASE_PG: { state: 'CLOSED', failures: 0, lastFailure: null },
    REDIS_CACHE: { state: 'CLOSED', failures: 0, lastFailure: null }
};

const getBreakerStatus = () => {
    console.log('[CircuitDashboard] Current System Circuit States:', breakers);
    return breakers;
};

const toggleBreaker = (name, forceState) => {
    if (breakers[name]) {
        breakers[name].state = forceState;
        console.warn(`[CircuitDashboard] Breaker ${name} MANUALLY toggled to ${forceState}`);
    }
};

module.exports = { getBreakerStatus, toggleBreaker };
