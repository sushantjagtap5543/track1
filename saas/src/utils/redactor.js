/**
 * Anti-Gravity Log Redactor
 * Automatically scrubs PII from application logs.
 */

const PII_KEYS = ['email', 'password', 'token', 'secret', 'phone', 'name'];

const redact = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const newObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (PII_KEYS.includes(key.toLowerCase())) {
      newObj[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object') {
      newObj[key] = redact(obj[key]);
    } else {
      newObj[key] = obj[key];
    }
  }

  return newObj;
};

module.exports = redact;
