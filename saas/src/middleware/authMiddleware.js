import jwt from 'jsonwebtoken';
import cache from '../services/cache.js';

export const authenticateToken = async (req, res, next) => {
  // In development mode, provide a default admin user for easier testing
  const isDevMode = process.env.NODE_ENV === 'development';
  if (isDevMode && req.query.mode === 'dev-admin') {
    req.user = { userId: 1, role: 'admin', traccarUserId: 1 };
    return next();
  }

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

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // 2. Check if user is globally suspended
    const isUserRevoked = await cache.get(`revoked_user:${user.userId}`);
    if (isUserRevoked) {
      return res.status(401).json({ error: 'Account has been suspended. Please contact support.' });
    }

    req.user = user; // Contains { userId, role, traccarUserId }
    next();
  });
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role` });
    }
    next();
  };
};
