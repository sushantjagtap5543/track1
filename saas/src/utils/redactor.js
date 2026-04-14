/**
 * Anti-Gravity Log Redactor
 * Automatically scrub PII from application logs.
 */

const PII_KEYS = ['email', 'password', 'token', 'secret', 'phone', 'name'];

const redact = (obj, seen = new WeakSet()) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (seen.has(obj)) return '[Circular]';
  seen.add(obj);

  const newObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (PII_KEYS.includes(key.toLowerCase())) {
      newObj[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      newObj[key] = redact(obj[key], seen);
    } else {
      newObj[key] = obj[key];
    }
  }

  return newObj;
};

export default redact;
