/**
 * Generic provider — yt-dlp handles hundreds of sites
 * Used when no specialized provider matches
 */

const { BaseProvider } = require('./baseProvider');
const { runYtDlpJson } = require('../utils/ytDlpRunner');
const { normalizeInfo } = require('../utils/formatNormalize');
const { mapYtDlpError, Errors } = require('../utils/errors');

class GenericProvider extends BaseProvider {
  constructor(id = 'generic') {
    super(id);
  }

  canHandle() {
    return true;
  }

  async analyze(url) {
    try {
      const info = await runYtDlpJson(url, [], 60000);
      if (info.is_live || info.live_status === 'is_live') {
        throw Errors.liveNotSupported();
      }
      return normalizeInfo(info, this.id);
    } catch (err) {
      if (err.code && typeof err.code === 'string') throw err;
      throw mapYtDlpError(err);
    }
  }

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
      '--fragment-retries', '8',
      '-o', outputTemplate,
      '--restrict-filenames',
      '--no-mtime'
    ];

    if (audioOnly || outputFormat === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      args.push('-f', 'ba/b');
    } else if (formatId && formatId !== 'best') {
      args.push('-f', `${formatId}+bestaudio/${formatId}/bv*+ba/b`);
      if (outputFormat === 'mp4') args.push('--merge-output-format', 'mp4');
      else if (outputFormat === 'webm') args.push('--merge-output-format', 'webm');
    } else {
      args.push('-f', 'bv*+ba/b');
      if (outputFormat === 'webm') args.push('--merge-output-format', 'webm');
      else args.push('--merge-output-format', 'mp4');
    }

    args.push(url);
    return args;
  }
}

module.exports = { GenericProvider };
