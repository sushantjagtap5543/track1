import crypto from 'crypto';

/**
 * Anti-Gravity Security Utilities
 * Tools for sensitive data protection.
 */

export const hashField = (value) => {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const obfuscateEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  return `${user[0]}***@${domain}`;
};
