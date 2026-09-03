/**
 * VideoVault Backend Server
 * Professional Video Downloader API
 * All heavy processing happens here - never expose sensitive logic to frontend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');

const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { validateUrl } = require('./middleware/validateUrl');
const analyzeRoutes = require('./routes/analyze');
const downloadRoutes = require('./routes/download');
const jobRoutes = require('./routes/jobs');
const { startCleanupJob } = require('./services/cleanupService');
const { getJob } = require('./services/jobManager');
const { commandExists, YT_DLP, FFMPEG } = require('./utils/ytDlpRunner');

const app = express();
const PORT = process.env.PORT || 3000;

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const TEMP_DIR = path.join(__dirname, '..', 'temp');
fs.ensureDirSync(DOWNLOADS_DIR);
fs.ensureDirSync(TEMP_DIR);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(rateLimiter);

app.use(['/backend', '/node_modules', '/downloads', '/temp', '/package.json'], (req, res) => {
  res.status(404).json({ error: true, message: 'Not found' });
});

const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT, { index: 'index.html' }));

app.use('/api/analyze', validateUrl, analyzeRoutes);
app.use('/api/download', validateUrl, downloadRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VideoVault', timestamp: new Date().toISOString() });
});

app.get('/api/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!/^[a-f0-9-]{36}$/i.test(jobId)) {
    return res.status(400).json({ error: true, message: 'Invalid job ID' });
  }

  let found = null;
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const match = files.find((f) => {
      if (!f.startsWith(jobId)) return false;
      if (/\.(part|ytdl|json|tmp)$/i.test(f)) return false;
      const ext = path.extname(f);
      return f === `${jobId}${ext}`;
    });
    if (match) found = path.join(DOWNLOADS_DIR, match);
  } catch (_) {
    found = null;
  }

  if (!found || !fs.existsSync(found)) {
    return res.status(404).json({ error: true, message: 'File not found or expired' });
  }

  const job = getJob(jobId);
  const downloadName = (job && job.result && job.result.displayName)
    ? job.result.displayName
    : path.basename(found);

  res.download(found, downloadName);
});

app.use(errorHandler);

startCleanupJob();

app.listen(PORT, () => {
  console.log(`VideoVault server running on http://localhost:${PORT}`);
  console.log(`Downloads dir: ${DOWNLOADS_DIR}`);
  console.log(`Temp dir: ${TEMP_DIR}`);
  console.log(`yt-dlp: ${commandExists(YT_DLP) ? 'ok' : 'MISSING'}`);
  console.log(`ffmpeg: ${commandExists(FFMPEG) ? 'ok' : 'MISSING'}`);
});

module.exports = app;
