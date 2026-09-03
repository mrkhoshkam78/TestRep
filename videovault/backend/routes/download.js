/**
 * Download Routes
 * POST /api/download — start job (async)
 */

const express = require('express');
const router = express.Router();
const { createJob, JOB_STATUS } = require('../services/jobManager');
const { downloadVideo } = require('../services/downloadService');
const { detectProvider } = require('../services/providerManager');

router.post('/', async (req, res, next) => {
  try {
    const url = req.sanitizedUrl;
    const {
      formatId,
      outputFormat = 'mp4',
      audioOnly = false,
      title = null
    } = req.body || {};

    if (outputFormat && !['mp4', 'webm', 'mp3'].includes(outputFormat)) {
      return res.status(400).json({
        error: true,
        message: 'Unsupported output format. Allowed: mp4, webm, mp3',
        code: 'INVALID_FORMAT'
      });
    }

    const provider = detectProvider(url);
    const job = createJob(url, {
      formatId,
      outputFormat,
      audioOnly,
      title,
      provider
    });

    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      provider,
      message: 'Download job queued'
    });

    downloadVideo(job.id, url, { formatId, outputFormat, audioOnly, title })
      .catch((err) => {
        console.error(`[Download] Job ${job.id} failed:`, err.code || '', err.message);
      });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
