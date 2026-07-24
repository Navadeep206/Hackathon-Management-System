/**
 * 404 Middleware - Handles invalid routes by sending a consistent 404 JSON response.
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
};

/**
 * Global Error Handler - Catches all uncaught/thrown errors and sends a consistent JSON response.
 * Handles Internal Server Errors, Validation Errors, and Database Errors (Mongoose/MongoDB).
 */
export const errorHandler = (err, req, res, next) => {
  // If response headers are already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Internal Server Error";

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Resource not found. Invalid field: ${err.path}`;
    statusCode = 400;
  }

  // Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // MongoDB Duplicate Key Error (e.g., duplicate email)
  if (err.code === 11000) {
    const duplicateKey = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered for: ${duplicateKey}`;
    statusCode = 400;
  }

  // Log error stack to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
