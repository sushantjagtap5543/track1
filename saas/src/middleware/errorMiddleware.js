// saas/src/middleware/errorMiddleware.js

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 'no-id';
  
  // Standardized Error Object
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString(),
    path: req.path,
    correlationId: correlationId
  };

  // Structured Logging
  console.error(JSON.stringify({
    level: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ...errorResponse
  }));

  res.status(errorResponse.status).json(errorResponse);
};

export default errorHandler;
