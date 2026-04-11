/**
 * Anti-Gravity Global Load Shedding Guard
 * Proactively sheds non-critical traffic during predicted system stress.
 */

const loadShedding = (req, res, next) => {
    const isCritical = req.path.startsWith('/api/track') || req.path.startsWith('/api/auth');
    const isSystemStressed = global.PREDICTIVE_LOAD_SIGNAL === 'SHED_NON_CRITICAL';

    if (isSystemStressed && !isCritical) {
        console.warn(`[LoadShedding] DROP: Shedding non-critical request: ${req.path}`);
        return res.status(503).json({
            error: 'SERVICE_UNDER_LOAD',
            message: 'Non-critical services are temporarily suspended to ensure tracking fidelity.'
        });
    }

    next();
};

module.exports = loadShedding;
