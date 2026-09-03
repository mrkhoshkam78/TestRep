/**
 * HLS / M3U8 provider
 */

const { BaseProvider } = require('./baseProvider');
const { runYtDlpJson } = require('../utils/ytDlpRunner');
const { normalizeInfo } = require('../utils/formatNormalize');
const { mapYtDlpError } = require('../utils/errors');

class HlsProvider extends BaseProvider {
  constructor() {
    super('hls');
  }

  canHandle(url) {
    return /(\.m3u8)(\?|#|$)|\/hls\//i.test(url);
  }

  async analyze(url) {
    try {
      const info = await runYtDlpJson(url, [
        '--use-extractors', 'generic',
        '--downloader', 'm3u8:native'
      ]);
      return normalizeInfo(info, this.id);
    } catch (err) {
      throw (err.code && typeof err.code === 'string') ? err : mapYtDlpError(err);
    }
  }

  buildDownloadArgs(url, options = {}) {
    const { outputTemplate, audioOnly, outputFormat, formatId } = options;
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--retries', '5',
      '--fragment-retries', '10',
      '--concurrent-fragments', '4',
      '--downloader', 'm3u8:native',
      '-o', outputTemplate,
      '--restrict-filenames',
      '--no-mtime'
    ];
    if (audioOnly || outputFormat === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (formatId && formatId !== 'best') {
      args.push('-f', `${formatId}+bestaudio/${formatId}/bv*+ba/b`);
    } else {
      args.push('-f', 'bv*+ba/b');
    }
    if (!(audioOnly || outputFormat === 'mp3')) {
      if (outputFormat === 'webm') args.push('--merge-output-format', 'webm');
      else args.push('--merge-output-format', 'mp4');
    }
    args.push(url);
    return args;
  }
}

module.exports = { HlsProvider };
