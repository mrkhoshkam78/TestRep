/**
 * Centralized Error Handler
 */

function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.message || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Never leak internal details
  const safeMessage = status === 500
    ? 'An unexpected error occurred while processing your request.'
    : message;

  res.status(status).json({
    error: true,
    message: safeMessage,
    code: err.code || 'INTERNAL_ERROR'
  });
}

module.exports = { errorHandler };
