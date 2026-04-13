/**
 * Mock Redis client for JWT blacklisting in local environments.
 * In production, this should be replaced with a real Redis connection.
 */
const blacklist = new Set();

const blacklistToken = async (token, expiry) => {
  blacklist.add(token);
  // Auto-clean after expiry (simple mock implementation)
  setTimeout(() => {
    blacklist.delete(token);
  }, expiry * 1000);
};

const isBlacklisted = async (token) => {
  return blacklist.has(token);
};

module.exports = { blacklistToken, isBlacklisted };
