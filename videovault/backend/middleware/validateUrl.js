/**
 * URL Validation & Sanitization Middleware
 * Protects against SSRF, invalid schemes, private IPs, etc.
 */

const { URL } = require('url');

const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal'
];

const BLOCKED_SCHEMES = ['file', 'ftp', 'data', 'javascript'];

function isPrivateIP(hostname) {
  // Simple private IP check
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  if (/^127\./.test(hostname)) return true;
  if (hostname === 'localhost') return true;
  return false;
}

function validateUrl(req, res, next) {
  const url = req.body?.url || req.query?.url;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: true,
      message: 'URL is required',
      code: 'MISSING_URL'
    });
  }

  const trimmed = url.trim();

  if (trimmed.length > 2048) {
    return res.status(400).json({
      error: true,
      message: 'URL is too long',
      code: 'URL_TOO_LONG'
    });
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    return res.status(400).json({
      error: true,
      message: 'Invalid URL format',
      code: 'INVALID_URL'
    });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({
      error: true,
      message: 'Only HTTP and HTTPS URLs are allowed',
      code: 'INVALID_SCHEME'
    });
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.includes(hostname) || isPrivateIP(hostname)) {
    return res.status(400).json({
      error: true,
      message: 'Access to this host is not allowed',
      code: 'BLOCKED_HOST'
    });
  }

  // Attach sanitized URL
  req.sanitizedUrl = trimmed;
  next();
}

module.exports = { validateUrl };
