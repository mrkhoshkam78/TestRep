/**
 * YouTube provider
 * Optimized format selection, merge, and error handling
 * Does NOT bypass DRM, age-gates requiring login, or private content
 */

const { BaseProvider } = require('./baseProvider');
const { runYtDlpJson } = require('../utils/ytDlpRunner');
const { normalizeInfo } = require('../utils/formatNormalize');
const { mapYtDlpError, Errors } = require('../utils/errors');

class YoutubeProvider extends BaseProvider {
  constructor() {
    super('youtube');
  }

  canHandle(url) {
    return /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url);
  }

  async analyze(url) {
    try {
      const info = await runYtDlpJson(url, [], 75000);

      if (info.is_live || info.live_status === 'is_live') {
        throw Errors.liveNotSupported();
      }

      const formats = info.formats || [];
      const onlyDrm = formats.length > 0 && formats.every(
        (f) => f.has_drm || (f.format_note || '').toLowerCase().includes('drm')
      );
      if (onlyDrm) throw Errors.drmProtected();

      const normalized = normalizeInfo(info, this.id);

      if (!normalized.formats.combined.length && normalized.formats.video.length) {
        normalized.needsMerge = true;
      }

      return normalized;
    } catch (err) {
      if (err.code && typeof err.code === 'string') throw err;
      throw mapYtDlpError(err);
    }
  }

  /**
   * Build robust format selector for YouTube
   * Prefer MP4 (avc1 + mp4a) for compatibility, then best overall
   */
  buildDownloadArgs(url, options = {}) {
    const {
      outputTemplate,
      audioOnly = false,
      outputFormat = 'mp4',
      formatId = 'best'
    } = options;

    const args = [
      '--no-playlist',
      '--no-warnings',
      '--retries', '5',
      '--fragment-retries', '10',
      '--concurrent-fragments', '4',
      '-o', outputTemplate,
      '--restrict-filenames',
      '--no-mtime'
    ];

    if (audioOnly || outputFormat === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      args.push('-f', 'ba[ext=m4a]/ba/b');
    } else if (formatId && formatId !== 'best') {
      args.push('-f', `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/${formatId}/bv*+ba/b`);
      if (outputFormat === 'mp4') args.push('--merge-output-format', 'mp4');
      else if (outputFormat === 'webm') args.push('--merge-output-format', 'webm');
    } else if (outputFormat === 'webm') {
      args.push(
        '-f',
        'bv*[ext=webm]+ba[ext=webm]/bv*+ba/b',
        '--merge-output-format', 'webm'
      );
    } else {
      args.push(
        '-f',
        [
          'bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]',
          'bv*[ext=mp4]+ba[ext=m4a]',
          'bv*+ba',
          'b'
        ].join('/'),
        '--merge-output-format', 'mp4'
      );
    }

    args.push(url);
    return args;
  }
}

module.exports = { YoutubeProvider };
