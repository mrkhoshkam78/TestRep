/**
 * Provider Manager
 * Provider-based architecture for different video sources
 * Extensible without changing core logic
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

/**
 * Detect provider from URL
 */
function detectProvider(url) {
  const lower = url.toLowerCase();

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  if (lower.includes('vimeo.com')) return 'vimeo';
  if (lower.includes('dailymotion.com')) return 'dailymotion';
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.endsWith('.m3u8') || lower.includes('m3u8')) return 'hls';
  if (lower.endsWith('.mpd') || lower.includes('.mpd')) return 'dash';
  if (/\.(mp4|webm|mkv|mov|m4v|mpeg|mpg)(\?|$)/i.test(lower)) return 'direct';

  return 'generic'; // yt-dlp handles many sites
}

/**
 * Analyze video info using yt-dlp
 * Returns formats, metadata, etc.
 */
async function analyzeWithYtDlp(url) {
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-playlist',
      '--max-downloads', '1',
      url
    ], {
      timeout: 45000,
      maxBuffer: 10 * 1024 * 1024
    });

    const info = JSON.parse(stdout);
    return normalizeInfo(info);
  } catch (err) {
    // Parse yt-dlp error messages
    const msg = err.stderr || err.message || '';
    if (msg.includes('Private video') || msg.includes('private')) {
      const e = new Error('This content is private and cannot be accessed.');
      e.code = 'PRIVATE_CONTENT';
      e.status = 403;
      throw e;
    }
    if (msg.includes('Sign in') || msg.includes('login') || msg.includes('authentication')) {
      const e = new Error('This content requires authentication. Please use content you have legal access to.');
      e.code = 'AUTH_REQUIRED';
      e.status = 401;
      throw e;
    }
    if (msg.includes('Unsupported URL') || msg.includes('No video')) {
      const e = new Error('Unsupported or invalid URL. Please check the link.');
      e.code = 'UNSUPPORTED_URL';
      e.status = 400;
      throw e;
    }
    if (msg.includes('DRM') || msg.includes('protected')) {
      const e = new Error('This content is DRM-protected and cannot be downloaded.');
      e.code = 'DRM_PROTECTED';
      e.status = 403;
      throw e;
    }
    const e = new Error('Failed to analyze the video. The URL may be invalid or the source is temporarily unavailable.');
    e.code = 'ANALYZE_FAILED';
    e.status = 422;
    throw e;
  }
}

function normalizeInfo(info) {
  const formats = (info.formats || [])
    .filter(f => f.url || f.manifest_url)
    .map(f => ({
      formatId: f.format_id,
      ext: f.ext || 'unknown',
      resolution: f.resolution || (f.height ? `${f.width || '?'}x${f.height}` : null),
      height: f.height || null,
      width: f.width || null,
      fps: f.fps || null,
      vcodec: f.vcodec !== 'none' ? f.vcodec : null,
      acodec: f.acodec !== 'none' ? f.acodec : null,
      filesize: f.filesize || f.filesize_approx || null,
      tbr: f.tbr || null,
      abr: f.abr || null,
      vbr: f.vbr || null,
      protocol: f.protocol || null,
      note: f.format_note || f.format || null,
      hasVideo: f.vcodec && f.vcodec !== 'none',
      hasAudio: f.acodec && f.acodec !== 'none',
      isHls: (f.protocol || '').includes('m3u8') || (f.ext || '') === 'm3u8',
      isDash: (f.protocol || '').includes('dash') || (f.ext || '') === 'mpd'
    }));

  // Prefer unique useful formats
  const videoFormats = formats
    .filter(f => f.hasVideo)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const audioFormats = formats
    .filter(f => f.hasAudio && !f.hasVideo)
    .sort((a, b) => (b.abr || 0) - (a.abr || 0));

  const combined = formats.filter(f => f.hasVideo && f.hasAudio);

  return {
    id: info.id,
    title: info.title || 'Untitled',
    description: (info.description || '').slice(0, 500),
    duration: info.duration || null,
    thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails[0]?.url) || null,
    uploader: info.uploader || info.channel || null,
    webpageUrl: info.webpage_url || info.original_url,
    extractor: info.extractor || info.extractor_key,
    provider: detectProvider(info.webpage_url || ''),
    formats: {
      all: formats.slice(0, 50), // limit
      video: videoFormats.slice(0, 20),
      audio: audioFormats.slice(0, 10),
      combined: combined.slice(0, 15)
    },
    isLive: info.is_live || false,
    ageLimit: info.age_limit || 0
  };
}

module.exports = {
  detectProvider,
  analyzeWithYtDlp
};
