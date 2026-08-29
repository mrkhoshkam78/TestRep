/**
 * Download Routes
 * POST /api/download - Start a download job
 */

const express = require('express');
const router = express.Router();
const { createJob, JOB_STATUS } = require('../services/jobManager');
const { downloadVideo } = require('../services/downloadService');

router.post('/', async (req, res, next) => {
  try {
    const url = req.sanitizedUrl;
    const { formatId, outputFormat = 'mp4', audioOnly = false } = req.body;

    // Basic limits
    if (outputFormat && !['mp4', 'webm', 'mp3'].includes(outputFormat)) {
      return res.status(400).json({
        error: true,
        message: 'Unsupported output format. Allowed: mp4, webm, mp3',
        code: 'INVALID_FORMAT'
      });
    }

    const job = createJob(url, { formatId, outputFormat, audioOnly });

    // Respond immediately with job id, process async
    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Download job started'
    });

    // Fire and forget (progress tracked via job)
    downloadVideo(job.id, url, { formatId, outputFormat, audioOnly })
      .catch(err => {
        console.error(`[Download] Job ${job.id} failed:`, err.message);
      });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
