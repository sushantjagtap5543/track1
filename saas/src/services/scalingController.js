import { getHealthTrend } from './predictiveHealth.js';

/**
 * Anti-Gravity Scaling Controller
 * Autonomously evaluates resource needs and outputs scaling recommendations.
 */

export const evaluateScaling = () => {
    const trend = getHealthTrend();
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    console.log(`[ScalingController] Analyzing system: ${trend} | Heap: ${Math.round(memoryUsage)}MB`);
    
    if (memoryUsage > 400 || trend === 'UNHEALTHY_TREND') {
        return {
            decision: 'SCALE_UP',
            recommendation: 'Increase replica count or vertical memory allocation. Threshold exceeded.',
            priority: 'HIGH'
        };
    }
    
    if (memoryUsage < 50 && trend === 'OPTIMAL') {
        return {
            decision: 'SCALE_DOWN',
            recommendation: 'System is under-utilized. Consider reducing replicas for cost optimization.',
            priority: 'LOW'
        };
    }
    
    return { decision: 'STABLE', recommendation: 'System within optimal operation bounds.', priority: 'NONE' };
};
