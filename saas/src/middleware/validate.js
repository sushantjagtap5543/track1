import { z } from 'zod';

/**
 * Anti-Gravity Validation Middleware
 * Enforces strict schemas using Zod.
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: err.errors
      });
    }
    next(err);
  }
};

export default validate;
