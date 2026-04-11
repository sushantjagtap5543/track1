const crypto = require('crypto');

/**
 * Anti-Gravity Security Utilities
 * Tools for sensitive data protection.
 */

const hashField = (value) => {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
};

const obfuscateEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  return `${user[0]}***@${domain}`;
};

module.exports = { hashField, obfuscateEmail };
