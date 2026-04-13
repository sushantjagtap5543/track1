const jwt = require('jsonwebtoken');
const cache = require('../services/cache');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token format: "Bearer [TOKEN]"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // 1. Check for revoked tokens (Blacklist)
  const isRevoked = await cache.get(`revoked_token:${token}`);
  if (isRevoked) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  // 2. Check if user is globally suspended (Scenario 5)
  // We'll verify this AFTER jwt.verify to get the userId, or now if we can decode without verify.

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // 2. Check if user is globally suspended (Scenario 5)
    const isUserRevoked = await cache.get(`revoked_user:${user.userId}`);
    if (isUserRevoked) {
      return res.status(401).json({ error: 'Account has been suspended. Please contact support.' });
    }

    req.user = user; // Contains { userId, role, traccarUserId }
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role` });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
