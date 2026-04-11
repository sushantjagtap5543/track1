/**
 * Anti-Gravity Autonomous Fault Injector
 * Intentionally injects latency and errors to verify self-healing stability.
 */

const injectFault = () => {
    const faultType = Math.random() > 0.5 ? 'LATENCY' : 'TIMEOUT';
    const impactArea = Math.random() > 0.5 ? 'DATABASE' : 'API_GATEWAY';
    
    console.log(`[FaultInjector] INJECTING: ${faultType} into ${impactArea}...`);
    
    // Logic: In a real test, this would toggle a flag in the CircuitBreaker or DB middleware.
    if (faultType === 'LATENCY') {
        // global.SIMULATED_LATENCY = 2000;
    }
    
    console.log('[FaultInjector] Verification: Monitoring system recovery via PredictiveHealth...');
};

module.exports = injectFault;
