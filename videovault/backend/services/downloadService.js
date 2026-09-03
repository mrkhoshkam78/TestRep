/**
 * Download & Processing Service
 * Streaming download via yt-dlp, merge/convert via FFmpeg (invoked by yt-dlp)
 * Progress is parsed from yt-dlp stdout — no large buffering in RAM
 */

const path = require('path');
const fs = require('fs-extra');
const { updateJob, JOB_STATUS } = require('./jobManager');
const { buildDownloadArgs, resolveProvider } = require('./providerManager');
const { spawnYtDlpDownload, ensureBinaries } = require('../utils/ytDlpRunner');
const { mapYtDlpError } = require('../utils/errors');
const { sanitizeFilename } = require('../utils/formatNormalize');

const DOWNLOADS_DIR = path.join(__dirname, '..', '..', 'downloads');
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

const SKIP_FILE_RE = /\.(part|ytdl|json|tmp|webp|jpg|jpeg|png|srt|vtt)$/i;
const FRAGMENT_RE = /\.f[\w-]+\./i;
const MEDIA_EXTS = ['.mp4', '.webm', '.mkv', '.mp3', '.m4a', '.m4v', '.mov', '.ogg', '.aac'];

function parseProgressLine(line, state) {
  const pct = line.match(/\[download\]\s+(\d+\.?\d*)%/);
  if (pct) {
    state.progress = Math.min(92, Math.round(parseFloat(pct[1])));
  }
  const speed = line.match(/\sat\s+([\d.]+\s*[KMGT]?i?B\/s)/i);
  if (speed) state.speed = speed[1].replace(/\s+/g, '');
  const eta = line.match(/ETA\s+(\d+:\d+(?::\d+)?)/);
  if (eta) state.eta = eta[1];
  const size = line.match(/of\s+~?([\d.]+\s*[KMGT]?i?B)/i);
  if (size) state.totalLabel = size[1].replace(/\s+/g, '');

  const dest =
    line.match(/\[download\]\s+Destination:\s+(.+)$/i) ||
    line.match(/\[ExtractAudio\]\s+Destination:\s+(.+)$/i) ||
    line.match(/Merging formats into ["'](.+)["']/i) ||
    line.match(/\[Merger\].*["'](.+)["']/i);
  if (dest) {
    state.outputFile = dest[1].trim().replace(/^["']|["']$/g, '');
  }

  if (/\[Merger\]|Merging formats/i.test(line)) {
    state.status = JOB_STATUS.PROCESSING;
    state.message = 'Merging audio and video...';
    state.progress = Math.max(state.progress, 93);
  } else if (/\[ExtractAudio\]|Extracting audio/i.test(line)) {
    state.status = JOB_STATUS.PROCESSING;
    state.message = 'Extracting audio...';
    state.progress = Math.max(state.progress, 93);
  } else if (/\[ffmpeg\]/i.test(line)) {
    state.status = JOB_STATUS.PROCESSING;
    state.message = 'Processing with FFmpeg...';
    state.progress = Math.max(state.progress, 94);
  } else if (state.progress > 0 && state.status === JOB_STATUS.DOWNLOADING) {
    state.message = `Downloading... ${state.progress}%`;
  }
  return state;
}

function isFinalMediaFile(filename, jobId) {
  if (!filename || !filename.startsWith(jobId)) return false;
  if (SKIP_FILE_RE.test(filename)) return false;
  if (FRAGMENT_RE.test(filename)) return false;
  const ext = path.extname(filename).toLowerCase();
  return MEDIA_EXTS.includes(ext);
}

async function pickDownloadedFile(jobId, hintedPath) {
  if (hintedPath) {
    const hinted = path.basename(hintedPath);
    const abs = path.isAbsolute(hintedPath) ? hintedPath : path.join(TEMP_DIR, hinted);
    if (await fs.pathExists(abs)) {
      const st = await fs.stat(abs);
      if (st.isFile() && st.size > 0 && isFinalMediaFile(path.basename(abs), jobId)) {
        return path.basename(abs);
      }
    }
  }

  const files = await fs.readdir(TEMP_DIR);
  const candidates = files.filter((f) => isFinalMediaFile(f, jobId));
  if (!candidates.length) return null;

  const ranked = [];
  for (const f of candidates) {
    const st = await fs.stat(path.join(TEMP_DIR, f)).catch(() => null);
    if (!st || !st.isFile() || st.size <= 0) continue;
    ranked.push({ f, size: st.size, ext: path.extname(f).toLowerCase() });
  }
  ranked.sort((a, b) => {
    const ia = MEDIA_EXTS.indexOf(a.ext);
    const ib = MEDIA_EXTS.indexOf(b.ext);
    const oa = ia === -1 ? 99 : ia;
    const ob = ib === -1 ? 99 : ib;
    if (oa !== ob) return oa - ob;
    return b.size - a.size;
  });
  return ranked[0] ? ranked[0].f : null;
}

async function waitForFile(jobId, hintedPath, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const found = await pickDownloadedFile(jobId, hintedPath);
    if (found) return found;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

async function downloadVideo(jobId, url, options = {}) {
  const {
    formatId = 'best',
    outputFormat = 'mp4',
    audioOnly = false,
    title = null
  } = options;

  await fs.ensureDir(TEMP_DIR);
  await fs.ensureDir(DOWNLOADS_DIR);

  try {
    ensureBinaries();
  } catch (err) {
    const mapped = err.code ? err : mapYtDlpError(err, 'download');
    updateJob(jobId, {
      status: JOB_STATUS.FAILED,
      progress: 0,
      error: mapped.message,
      errorCode: mapped.code,
      message: mapped.message
    });
    throw mapped;
  }

  const provider = resolveProvider(url);

  updateJob(jobId, {
    status: JOB_STATUS.EXTRACTING,
    progress: 2,
    message: `Extracting media info (${provider.id})...`,
    provider: provider.id
  });

  const safeTitle = sanitizeFilename(title || 'video');
  const outTemplate = path.join(TEMP_DIR, `${jobId}.%(ext)s`);

  const { args } = buildDownloadArgs(url, {
    outputTemplate: outTemplate,
    formatId,
    outputFormat,
    audioOnly: audioOnly || outputFormat === 'mp3'
  });

  updateJob(jobId, {
    status: JOB_STATUS.DOWNLOADING,
    progress: 5,
    message: 'Starting download...'
  });

  return new Promise((resolve, reject) => {
    const state = {
      progress: 5,
      speed: null,
      eta: null,
      totalLabel: null,
      status: JOB_STATUS.DOWNLOADING,
      message: 'Downloading...',
      stderrBuf: '',
      outputFile: null
    };

    let lastEmit = 0;
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      const mapped = err.code && typeof err.code === 'string' ? err : mapYtDlpError(err, 'download');
      updateJob(jobId, {
        status: JOB_STATUS.FAILED,
        progress: 0,
        error: mapped.message,
        errorCode: mapped.code || 'DOWNLOAD_FAILED',
        message: mapped.message
      });
      reject(mapped);
    };

    let proc;
    try {
      proc = spawnYtDlpDownload(args, {
        onStdout: (text) => {
          for (const line of text.split('\n')) {
            if (!line.trim()) continue;
            parseProgressLine(line, state);
          }
          const now = Date.now();
          if (now - lastEmit > 400) {
            lastEmit = now;
            updateJob(jobId, {
              status: state.status,
              progress: state.progress,
              speed: state.speed,
              eta: state.eta,
              message: state.message
            });
          }
        },
        onStderr: (text) => {
          state.stderrBuf += text;
          for (const line of text.split('\n')) {
            if (
              line.includes('[download]') ||
              line.includes('[Merger]') ||
              line.includes('[ffmpeg]') ||
              line.includes('[ExtractAudio]') ||
              /Destination:/i.test(line)
            ) {
              parseProgressLine(line, state);
            }
          }
        }
      });
    } catch (err) {
      return fail(err);
    }

    proc.on('close', async (code) => {
      if (code !== 0) {
        const fakeErr = { stderr: state.stderrBuf, message: state.stderrBuf };
        return fail(mapYtDlpError(fakeErr, 'download'));
      }

      try {
        updateJob(jobId, {
          status: JOB_STATUS.PROCESSING,
          progress: 96,
          message: 'Finalizing file...'
        });

        const downloaded = await waitForFile(jobId, state.outputFile);
        if (!downloaded) {
          throw mapYtDlpError({
            message: 'Downloaded file not found in temp directory',
            stderr: state.stderrBuf
          }, 'download');
        }

        const tempPath = path.join(TEMP_DIR, downloaded);
        const ext = path.extname(downloaded) || (audioOnly || outputFormat === 'mp3' ? '.mp3' : '.mp4');
        const finalName = `${jobId}${ext}`;
        const finalPath = path.join(DOWNLOADS_DIR, finalName);

        await fs.move(tempPath, finalPath, { overwrite: true });

        const leftovers = await fs.readdir(TEMP_DIR).catch(() => []);
        for (const f of leftovers) {
          if (f.startsWith(jobId)) {
            await fs.remove(path.join(TEMP_DIR, f)).catch(() => {});
          }
        }

        const stats = await fs.stat(finalPath).catch(() => null);

        const result = {
          jobId,
          filename: finalName,
          displayName: `${safeTitle}${ext}`,
          downloadUrl: `/api/file/${jobId}`,
          format: ext.replace('.', ''),
          mimeType: guessMime(ext),
          filesize: stats ? stats.size : null,
          provider: provider.id
        };

        updateJob(jobId, {
          status: JOB_STATUS.COMPLETED,
          progress: 100,
          message: 'Download completed',
          result
        });

        if (!settled) {
          settled = true;
          resolve(result);
        }
      } catch (err) {
        fail(err);
      }
    });

    proc.on('error', (err) => {
      fail(err);
    });
  });
}

function guessMime(ext) {
  const map = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.m4v': 'video/x-m4v',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

module.exports = { downloadVideo };
