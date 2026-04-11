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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
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
