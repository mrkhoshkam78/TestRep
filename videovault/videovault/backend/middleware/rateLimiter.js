/**
 * Rate Limiting Middleware
 * Protects against abuse and resource exhaustion
 */

const rateLimitStore = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // per window per IP

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  const entry = rateLimitStore.get(ip);

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + WINDOW_MS;
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please wait before trying again.',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    });
  }

  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt + WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = { rateLimiter };
