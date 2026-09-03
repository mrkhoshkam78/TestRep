/**
 * Centralized Error Handler
 */

function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.code || '', err.message || err);

  const status = Number(err.status || err.statusCode) || 500;
  const code = typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';

  const safeMessage = status === 500
    ? 'An unexpected error occurred while processing your request.'
    : (err.message || 'Request failed');

  res.status(status).json({
    error: true,
    message: safeMessage,
    code
  });
}

module.exports = { errorHandler };
