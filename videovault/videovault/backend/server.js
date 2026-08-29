/**
 * VideoVault Backend Server
 * Professional Video Downloader API
 * All heavy processing happens here - never expose sensitive logic to frontend
 */

// require('dotenv').config();
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

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const TEMP_DIR = path.join(__dirname, '..', 'temp');
fs.ensureDirSync(DOWNLOADS_DIR);
fs.ensureDirSync(TEMP_DIR);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend to load
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
app.use(rateLimiter);

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/analyze', validateUrl, analyzeRoutes);
app.use('/api/download', validateUrl, downloadRoutes);
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VideoVault', timestamp: new Date().toISOString() });
});

// Serve downloads securely (temporary signed URLs conceptually)
app.get('/api/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  // Basic validation
  if (!/^[a-f0-9-]{36}$/i.test(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }
  const filePath = path.join(DOWNLOADS_DIR, `${jobId}.mp4`);
  // Also check other extensions
  const possibleExts = ['.mp4', '.webm', '.mp3', '.mkv', '.m4a'];
  let found = null;
  for (const ext of possibleExts) {
    const p = path.join(DOWNLOADS_DIR, `${jobId}${ext}`);
    if (fs.existsSync(p)) {
      found = p;
      break;
    }
  }
  if (!found) {
    return res.status(404).json({ error: 'File not found or expired' });
  }
  res.download(found);
});

// Error handler
app.use(errorHandler);

// Start cleanup cron
startCleanupJob();

app.listen(PORT, () => {
  console.log(`VideoVault server running on http://localhost:${PORT}`);
  console.log(`Downloads dir: ${DOWNLOADS_DIR}`);
  console.log(`Temp dir: ${TEMP_DIR}`);
});

module.exports = app;
