/**
 * Download & Processing Service
 * Handles download, merge, convert using yt-dlp + FFmpeg
 * All heavy work stays on backend
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { updateJob, JOB_STATUS } = require('./jobManager');

const execFileAsync = promisify(execFile);

const DOWNLOADS_DIR = path.join(__dirname, '..', '..', 'downloads');
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

/**
 * Download video with yt-dlp
 */
async function downloadVideo(jobId, url, options = {}) {
  const {
    formatId = 'best',
    outputFormat = 'mp4',
    audioOnly = false
  } = options;

  updateJob(jobId, {
    status: JOB_STATUS.DOWNLOADING,
    progress: 5,
    message: 'Starting download...'
  });

  const outTemplate = path.join(TEMP_DIR, `${jobId}.%(ext)s`);

  const args = [
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '-o', outTemplate,
    '--restrict-filenames'
  ];

  if (audioOnly) {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (formatId && formatId !== 'best') {
    args.push('-f', formatId);
  } else {
    // Prefer best video+audio merged
    args.push('-f', 'bv*+ba/b');
  }

  // Merge to desired container when possible
  if (!audioOnly && outputFormat === 'mp4') {
    args.push('--merge-output-format', 'mp4');
  } else if (!audioOnly && outputFormat === 'webm') {
    args.push('--merge-output-format', 'webm');
  }

  args.push(url);

  return new Promise((resolve, reject) => {
    const proc = require('child_process').spawn('yt-dlp', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let lastProgress = 5;

    proc.stdout.on('data', (data) => {
      const line = data.toString();
      // Parse progress: [download]  45.2% of ... at 1.23MiB/s ETA 00:12
      const match = line.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (match) {
        const pct = Math.min(90, Math.round(parseFloat(match[1])));
        if (pct > lastProgress) {
          lastProgress = pct;
          updateJob(jobId, {
            progress: pct,
            message: `Downloading... ${pct}%`
          });
        }
      }
      const speedMatch = line.match(/at\s+([\d.]+\w+\/s)/);
      const etaMatch = line.match(/ETA\s+(\d+:\d+)/);
      if (speedMatch || etaMatch) {
        updateJob(jobId, {
          speed: speedMatch ? speedMatch[1] : null,
          eta: etaMatch ? etaMatch[1] : null
        });
      }
    });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', async (code) => {
      if (code !== 0) {
        const e = new Error('Download failed. The content may be protected, unavailable, or the source is blocked.');
        e.code = 'DOWNLOAD_FAILED';
        e.status = 422;
        updateJob(jobId, { status: JOB_STATUS.FAILED, error: e.message, progress: 0 });
        return reject(e);
      }

      try {
        // Find the downloaded file
        const files = await fs.readdir(TEMP_DIR);
        const downloaded = files.find(f => f.startsWith(jobId));
        if (!downloaded) {
          throw new Error('Downloaded file not found');
        }

        const tempPath = path.join(TEMP_DIR, downloaded);
        const ext = path.extname(downloaded) || (audioOnly ? '.mp3' : '.mp4');
        const finalPath = path.join(DOWNLOADS_DIR, `${jobId}${ext}`);

        // Move to downloads
        await fs.move(tempPath, finalPath, { overwrite: true });

        updateJob(jobId, {
          status: JOB_STATUS.COMPLETED,
          progress: 100,
          message: 'Download completed',
          result: {
            jobId,
            filename: `${jobId}${ext}`,
            downloadUrl: `/api/file/${jobId}`,
            format: ext.replace('.', '')
          }
        });

        resolve({
          jobId,
          path: finalPath,
          downloadUrl: `/api/file/${jobId}`,
          format: ext.replace('.', '')
        });
      } catch (err) {
        updateJob(jobId, { status: JOB_STATUS.FAILED, error: err.message });
        reject(err);
      }
    });

    proc.on('error', (err) => {
      updateJob(jobId, { status: JOB_STATUS.FAILED, error: err.message });
      reject(err);
    });
  });
}

module.exports = {
  downloadVideo
};
