/**
 * Shared yt-dlp process runner
 * Central place for binary path, timeouts, and safe args
 */

const { spawn, execFile, spawnSync } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { Errors } = require('./errors');

const YT_DLP = process.env.YT_DLP_PATH || 'yt-dlp';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const DEFAULT_TIMEOUT_MS = 90000;

let ytDlpOk = null;
let ffmpegOk = null;

function commandExists(cmd) {
  try {
    const r = spawnSync('which', [cmd], { stdio: 'ignore' });
    return r.status === 0;
  } catch {
    return false;
  }
}

function ensureBinaries() {
  if (ytDlpOk === null) ytDlpOk = commandExists(YT_DLP);
  if (ffmpegOk === null) ffmpegOk = commandExists(FFMPEG);
  if (!ytDlpOk) throw Errors.ytdlpMissing();
  if (!ffmpegOk) throw Errors.ffmpegMissing();
}

function commonDownloadFlags() {
  const flags = [
    '--ffmpeg-location', FFMPEG,
    '--no-check-certificates',
    '--socket-timeout', '30',
    '--progress',
    '--newline'
  ];
  return flags;
}

async function runYtDlpJson(url, extraArgs = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
  ensureBinaries();
  const args = [
    '--dump-json',
    '--no-download',
    '--no-warnings',
    '--no-playlist',
    '--no-check-certificates',
    '--socket-timeout', '20',
    '--retries', '3',
    '--fragment-retries', '3',
    '--ffmpeg-location', FFMPEG,
    ...extraArgs,
    url
  ];

  try {
    const { stdout, stderr } = await execFileAsync(YT_DLP, args, {
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    if (!stdout || !stdout.trim()) {
      const err = new Error(stderr || 'Empty yt-dlp output');
      err.stderr = stderr;
      throw err;
    }
    const trimmed = stdout.trim();
    const firstBrace = trimmed.indexOf('{');
    const jsonText = firstBrace > 0 ? trimmed.slice(firstBrace) : trimmed;
    return JSON.parse(jsonText);
  } catch (err) {
    if (err.code === 'ENOENT') throw Errors.ytdlpMissing();
    if (err.stderr) err.message = err.stderr;
    throw err;
  }
}

/**
 * Spawn yt-dlp for actual download with progress lines on stdout
 */
function spawnYtDlpDownload(args, { onStdout, onStderr } = {}) {
  ensureBinaries();
  const url = args[args.length - 1];
  const rest = args.slice(0, -1);
  const finalArgs = [...rest, ...commonDownloadFlags(), url];

  const proc = spawn(YT_DLP, finalArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  if (onStdout) proc.stdout.on('data', (d) => onStdout(d.toString('utf8')));
  if (onStderr) proc.stderr.on('data', (d) => onStderr(d.toString('utf8')));
  return proc;
}

module.exports = {
  YT_DLP,
  FFMPEG,
  runYtDlpJson,
  spawnYtDlpDownload,
  ensureBinaries,
  commandExists
};
