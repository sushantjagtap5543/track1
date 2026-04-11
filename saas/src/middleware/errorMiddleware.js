// saas/src/middleware/errorMiddleware.js

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = err.status || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
