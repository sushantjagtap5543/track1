import { v4 as uuidv4 } from 'uuid';

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

export default correlationIdMiddleware;
