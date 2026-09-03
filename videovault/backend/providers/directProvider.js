/**
 * Direct media provider (MP4, WebM, MOV, MKV, M4V, MPEG, audio files)
 * Tries HEAD/GET for metadata; falls back to yt-dlp if needed
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { BaseProvider } = require('./baseProvider');
const { normalizeInfo, mapFormat } = require('../utils/formatNormalize');
const { runYtDlpJson } = require('../utils/ytDlpRunner');
const { mapYtDlpError, Errors } = require('../utils/errors');

class DirectProvider extends BaseProvider {
  constructor() {
    super('direct');
  }

  canHandle(url) {
    return /\.(mp4|webm|mkv|mov|m4v|mpeg|mpg|m4a|mp3|ogg|aac)(\?|#|$)/i.test(url);
  }

  async analyze(url) {
    try {
      const meta = await this.probeDirect(url);
      if (meta) return meta;
    } catch (err) {
      if (err.code && typeof err.code === 'string' && err.code !== 'ANALYZE_FAILED') {
        throw err;
      }
    }

    try {
      const info = await runYtDlpJson(url, ['--use-extractors', 'generic']);
      return normalizeInfo(info, this.id);
    } catch (err) {
      throw (err.code && typeof err.code === 'string') ? err : mapYtDlpError(err);
    }
  }

  probeDirect(url, hops = 0) {
    return new Promise((resolve, reject) => {
      if (hops > 5) return reject(Errors.analyzeFailed('Too many redirects'));
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        return reject(Errors.unsupported());
      }
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        url,
        { method: 'HEAD', timeout: 12000, headers: { 'User-Agent': 'VideoVault/1.0' } },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            req.destroy();
            const next = new URL(res.headers.location, url).href;
            return this.probeDirect(next, hops + 1).then(resolve).catch(reject);
          }
          if (res.statusCode === 404) return reject(Errors.unavailable());
          if (res.statusCode === 403) return reject(Errors.authRequired());
          if (res.statusCode === 429) return reject(Errors.rateLimited());
          if (res.statusCode && res.statusCode >= 400) {
            return reject(Errors.analyzeFailed(`HTTP ${res.statusCode}`));
          }

          const ctype = (res.headers['content-type'] || '').split(';')[0].trim();
          const clen = parseInt(res.headers['content-length'] || '0', 10) || null;
          const pathname = parsed.pathname || '';
          const extMatch = pathname.match(/\.([a-z0-9]+)$/i);
          const ext = (extMatch ? extMatch[1] : (ctype.split('/')[1] || 'mp4')).toLowerCase();
          const isAudio = /^(audio\/|mp3|m4a|aac|ogg|flac|wav)/i.test(ctype + ext);

          const format = mapFormat({
            format_id: 'best',
            ext,
            filesize: clen,
            vcodec: isAudio ? 'none' : 'unknown',
            acodec: 'unknown',
            protocol: 'https',
            format_note: 'Direct'
          });

          resolve({
            id: null,
            title: decodeURIComponent(pathname.split('/').pop() || 'direct-media'),
            description: '',
            duration: null,
            thumbnail: null,
            uploader: null,
            webpageUrl: url,
            extractor: 'direct',
            provider: this.id,
            isLive: false,
            ageLimit: 0,
            needsMerge: false,
            recommendedFormatId: 'best',
            formats: {
              all: [format],
              video: isAudio ? [] : [format],
              audio: isAudio ? [format] : [],
              combined: isAudio ? [] : [format]
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(Errors.timeout());
      });
      req.end();
    });
  }

  buildDownloadArgs(url, options = {}) {
    const { outputTemplate, audioOnly, outputFormat } = options;
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--retries', '5',
      '--fragment-retries', '5',
      '-o', outputTemplate,
      '--restrict-filenames',
      '--no-mtime'
    ];
    if (audioOnly || outputFormat === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (outputFormat === 'mp4') {
      args.push('--merge-output-format', 'mp4');
    } else if (outputFormat === 'webm') {
      args.push('--merge-output-format', 'webm');
    }
    args.push(url);
    return args;
  }
}

module.exports = { DirectProvider };
