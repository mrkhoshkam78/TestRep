/**
 * Provider registry
 * Detection order: direct → HLS → DASH → platform-specific → generic
 */

const { detectMedia } = require('../utils/mediaDetect');
const { DirectProvider } = require('./directProvider');
const { HlsProvider } = require('./hlsProvider');
const { DashProvider } = require('./dashProvider');
const { YoutubeProvider } = require('./youtubeProvider');
const { GenericProvider } = require('./genericProvider');

const providers = {
  direct: new DirectProvider(),
  hls: new HlsProvider(),
  dash: new DashProvider(),
  youtube: new YoutubeProvider(),
  // Platform aliases → generic with tagged id
  vimeo: new GenericProvider('vimeo'),
  dailymotion: new GenericProvider('dailymotion'),
  twitch: new GenericProvider('twitch'),
  twitter: new GenericProvider('twitter'),
  facebook: new GenericProvider('facebook'),
  instagram: new GenericProvider('instagram'),
  tiktok: new GenericProvider('tiktok'),
  reddit: new GenericProvider('reddit'),
  soundcloud: new GenericProvider('soundcloud'),
  generic: new GenericProvider('generic')
};

/**
 * Resolve the best provider for a URL
 */
function resolveProvider(url) {
  const { mediaType, providerId } = detectMedia(url);

  // Explicit media-type path first
  if (mediaType === 'direct') return providers.direct;
  if (mediaType === 'hls') return providers.hls;
  if (mediaType === 'dash') return providers.dash;

  if (providers[providerId]) return providers[providerId];
  return providers.generic;
}

/**
 * Analyze URL via resolved provider
 */
async function analyzeUrl(url) {
  const provider = resolveProvider(url);
  const info = await provider.analyze(url);
  // Ensure provider field is set
  info.provider = info.provider || provider.id;
  info.mediaType = detectMedia(url).mediaType;
  return info;
}

/**
 * Build download CLI args via resolved provider
 */
function buildDownloadArgs(url, options) {
  const provider = resolveProvider(url);
  return { provider, args: provider.buildDownloadArgs(url, options) };
}

module.exports = {
  providers,
  resolveProvider,
  analyzeUrl,
  buildDownloadArgs,
  detectMedia
};
