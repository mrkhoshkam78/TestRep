/**
 * Automatic media type detection
 * Order: direct → HLS → DASH → platform provider
 */

const DIRECT_EXT = /\.(mp4|webm|mkv|mov|m4v|mpeg|mpg|m4a|mp3|ogg|aac|flac|wav)(\?|#|$)/i;
const HLS_RE = /(\.m3u8)(\?|#|$)|\/hls\/|format=m3u8|type=m3u8/i;
const DASH_RE = /(\.mpd)(\?|#|$)|\/dash\/|format=mpd|type=mpd/i;

const PLATFORM_RULES = [
  { id: 'youtube', test: (u) => /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(u) },
  { id: 'vimeo', test: (u) => /vimeo\.com/i.test(u) },
  { id: 'dailymotion', test: (u) => /dailymotion\.com|dai\.ly/i.test(u) },
  { id: 'twitch', test: (u) => /twitch\.tv/i.test(u) },
  { id: 'twitter', test: (u) => /(?:twitter\.com|x\.com)\/.+\/status/i.test(u) },
  { id: 'facebook', test: (u) => /facebook\.com|fb\.watch/i.test(u) },
  { id: 'instagram', test: (u) => /instagram\.com/i.test(u) },
  { id: 'tiktok', test: (u) => /tiktok\.com/i.test(u) },
  { id: 'reddit', test: (u) => /reddit\.com|v\.redd\.it/i.test(u) },
  { id: 'soundcloud', test: (u) => /soundcloud\.com/i.test(u) }
];

/**
 * @returns {{ mediaType: 'direct'|'hls'|'dash'|'platform'|'generic', providerId: string }}
 */
function detectMedia(url) {
  const u = (url || '').trim();

  if (DIRECT_EXT.test(u)) {
    return { mediaType: 'direct', providerId: 'direct' };
  }
  if (HLS_RE.test(u)) {
    return { mediaType: 'hls', providerId: 'hls' };
  }
  if (DASH_RE.test(u)) {
    return { mediaType: 'dash', providerId: 'dash' };
  }

  for (const rule of PLATFORM_RULES) {
    if (rule.test(u)) {
      return { mediaType: 'platform', providerId: rule.id };
    }
  }

  return { mediaType: 'generic', providerId: 'generic' };
}

module.exports = { detectMedia, DIRECT_EXT, HLS_RE, DASH_RE };
