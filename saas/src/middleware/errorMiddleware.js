// saas/src/middleware/errorMiddleware.js

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 'no-id';
  
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Specific Error Handling
  if (err.name === 'ZodError') {
    status = 400;
    message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  } else if (err.code?.startsWith('P')) {
    // Prisma errors
    status = 400;
    message = `Database Error: ${err.code}`;
  }

  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    correlationId: correlationId
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }

  console.error(`[GeoSure Error] [${correlationId}] ${status} - ${message}`);

  res.status(status).json(errorResponse);
};


export default errorHandler;
