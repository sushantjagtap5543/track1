/**
 * Anti-Gravity Adaptive Authentication Utility
 * Risk-based authentication velocity and reputation checks.
 */

const adaptiveAuth = (req) => {
    const ip = req.ip;
    const velocity = global.AUTH_VELOCITY_MAP?.[ip] || 0;

    console.log(`[AdaptiveAuth] Risk Analysis for ${ip}: Velocity=${velocity}`);

    if (velocity > 10) {
        console.warn(`[AdaptiveAuth] HIGH RISK: Velocity threshold exceeded for ${ip}. Requiring Stepped-Up MFA.`);
        return { action: 'REQUIRE_MFA', riskScore: 0.9 };
    }

    return { action: 'ALLOW', riskScore: 0.1 };
};

module.exports = adaptiveAuth;
