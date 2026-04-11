const { parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');

/**
 * Anti-Gravity Crypto Worker
 * Offloads heavy hashing/signing from the main event loop.
 */

if (parentPort) {
  const { action, payload } = workerData;
  
  if (action === 'hash') {
    const result = crypto.createHash('sha512').update(payload).digest('hex');
    parentPort.postMessage({ status: 'done', result });
  } else if (action === 'signPosition') {
    // Immutable Position Signing (HMAC-SHA256 for demo, would be EdDSA in production)
    const secret = process.env.JWT_SECRET || 'anti-gravity-position-secret';
    const hmac = crypto.createHmac('sha256', secret);
    const data = JSON.stringify(payload);
    hmac.update(data);
    const signature = hmac.digest('hex');
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    parentPort.postMessage({ status: 'done', result: { signature, hash } });
  } else if (action === 'sign') {
    // Heavy signing logic
    parentPort.postMessage({ status: 'done', result: 'signed_payload' });
  }
}
