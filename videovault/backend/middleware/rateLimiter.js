/**
 * Rate Limiting Middleware
 * Protects against abuse and resource exhaustion
 * Job status polling and file downloads are excluded so progress tracking works
 */

const rateLimitStore = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 40;

const SKIP_PREFIXES = ['/api/jobs', '/api/file', '/api/health'];

function shouldSkip(req) {
  const path = req.path || req.originalUrl || '';
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (SKIP_PREFIXES.some((p) => path.startsWith(p) || path.includes(p))) return true;
    if (!path.startsWith('/api')) return true;
  }
  return false;
}

function rateLimiter(req, res, next) {
  if (shouldSkip(req)) return next();

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
      error: true,
      message: 'Rate limit exceeded. Please wait before trying again.',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    });
  }

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt + WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = { rateLimiter };
