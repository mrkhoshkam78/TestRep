/**
 * Standard domain errors for the downloader engine
 */

function makeError(message, code, status = 422, extra = {}) {
  const e = new Error(message);
  e.code = code;
  e.status = status;
  Object.assign(e, extra);
  return e;
}

const Errors = {
  privateContent: () => makeError(
    'This content is private and cannot be accessed.',
    'PRIVATE_CONTENT', 403
  ),
  authRequired: () => makeError(
    'This content requires authentication. Only use content you are allowed to access.',
    'AUTH_REQUIRED', 401
  ),
  drmProtected: () => makeError(
    'This content is DRM-protected and cannot be downloaded.',
    'DRM_PROTECTED', 403
  ),
  paywall: () => makeError(
    'This content is behind a paywall or membership restriction.',
    'PAYWALL', 403
  ),
  geoRestricted: () => makeError(
    'This content is geo-restricted in the current region.',
    'GEO_RESTRICTED', 451
  ),
  unavailable: () => makeError(
    'Video is unavailable, removed, or the link has expired.',
    'UNAVAILABLE', 404
  ),
  rateLimited: () => makeError(
    'Source rate-limited the request. Please wait and try again.',
    'RATE_LIMITED', 429
  ),
  unsupported: () => makeError(
    'Unsupported or invalid URL.',
    'UNSUPPORTED_URL', 400
  ),
  formatUnavailable: () => makeError(
    'Requested format is not available for this media. Try another quality.',
    'FORMAT_UNAVAILABLE', 422
  ),
  analyzeFailed: (detail) => makeError(
    detail || 'Failed to analyze the media. The URL may be invalid or temporarily unavailable.',
    'ANALYZE_FAILED', 422
  ),
  downloadFailed: (detail) => makeError(
    detail || 'Download failed. The content may be protected or temporarily unavailable.',
    'DOWNLOAD_FAILED', 422
  ),
  timeout: () => makeError(
    'Request timed out while contacting the media source.',
    'TIMEOUT', 504
  ),
  liveNotSupported: () => makeError(
    'Live streams are not supported for download.',
    'LIVE_NOT_SUPPORTED', 422
  ),
  ytdlpMissing: () => makeError(
    'Download engine is not installed on the server (yt-dlp).',
    'YTDLP_MISSING', 500
  ),
  ffmpegMissing: () => makeError(
    'FFmpeg is not installed on the server. Merge/convert cannot run.',
    'FFMPEG_MISSING', 500
  )
};

/**
 * Map yt-dlp / network stderr to structured errors
 */
function mapYtDlpError(err, context = 'analyze') {
  const msg = `${err.stderr || ''} ${err.message || ''} ${err.stdout || ''}`.toLowerCase();

  if (err.code === 'ENOENT' || /not found|no such file/.test(msg) && /yt-dlp|ffmpeg/.test(msg)) {
    return /ffmpeg/.test(msg) ? Errors.ffmpegMissing() : Errors.ytdlpMissing();
  }
  if (/private video|private playlist|this video is private/.test(msg)) return Errors.privateContent();
  if (/sign in|login required|members-only|members only|authentication/.test(msg)) return Errors.authRequired();
  if (/\bdrm\b|widevine|playready|fairplay|encrypted/.test(msg)) return Errors.drmProtected();
  if (/premium|paywall|paid content|subscription/.test(msg)) return Errors.paywall();
  if (/not available in your country|geo.?restrict|blocked in your country/.test(msg)) return Errors.geoRestricted();
  if (/video is unavailable|video unavailable|has been removed|does not exist|404|http error 404|is not available/.test(msg)) return Errors.unavailable();
  if (/http error 429|too many requests|rate.?limit/.test(msg)) return Errors.rateLimited();
  if (/unsupported url|no video formats|no suitable|unable to extract|not a valid url/.test(msg)) return Errors.unsupported();
  if (/requested format not available|the requested format is not available|format is not available/.test(msg)) {
    return Errors.formatUnavailable();
  }
  if (/is live|live event/.test(msg) && /not support|cannot/.test(msg)) return Errors.liveNotSupported();
  if (/etimedout|timeout|timed out/.test(msg) || err.killed) return Errors.timeout();
  if (/http error 403/.test(msg)) return Errors.authRequired();
  if (/http error 5\d\d/.test(msg)) {
    return context === 'download'
      ? Errors.downloadFailed('Source server error. Try again later.')
      : Errors.analyzeFailed('Source server error. Try again later.');
  }

  return context === 'download' ? Errors.downloadFailed() : Errors.analyzeFailed();
}

module.exports = { makeError, Errors, mapYtDlpError };
