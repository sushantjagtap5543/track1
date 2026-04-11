const { v4: uuidv4 } = require('uuid');

/**
 * Distributed Tracing Middleware
 * Enhances requests with correlated Trace and Span IDs.
 */
const correlationIdMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const spanId = uuidv4();

  req.traceId = traceId;
  req.spanId = spanId;

  res.setHeader('X-Trace-ID', traceId);
  res.setHeader('X-Span-ID', spanId);

  next();
};

module.exports = correlationIdMiddleware;
