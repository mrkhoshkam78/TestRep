/**
 * Provider Manager (facade)
 * Delegates to Provider registry — keep imports stable for routes
 */

const {
  resolveProvider,
  analyzeUrl,
  buildDownloadArgs,
  detectMedia,
  providers
} = require('../providers');

function detectProvider(url) {
  return detectMedia(url).providerId;
}

async function analyzeWithYtDlp(url) {
  return analyzeUrl(url);
}

module.exports = {
  detectProvider,
  analyzeWithYtDlp,
  resolveProvider,
  analyzeUrl,
  buildDownloadArgs,
  detectMedia,
  providers
};
