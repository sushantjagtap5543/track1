/**
 * Anti-Gravity Zero-Trust Fingerprinting Middleware
 * Detects and prevents session fixation and hijacking.
 */

const fingerprint = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const sessionFingerprint = req.session?.fingerprint;

    const currentFingerprint = `${userAgent}-${ip}`;

    if (sessionFingerprint && sessionFingerprint !== currentFingerprint) {
        console.warn(`[SECURITY] Session Hijacking Attempt Detected! SID: ${req.sessionID} | Expected: ${sessionFingerprint} | Actual: ${currentFingerprint}`);
        return res.status(403).json({ error: 'SESSION_INTEGRITY_VIOLATION' });
    }

    if (!sessionFingerprint && req.session) {
        req.session.fingerprint = currentFingerprint;
    }

    next();
};

module.exports = fingerprint;
