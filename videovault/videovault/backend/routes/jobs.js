/**
 * Jobs Routes
 * GET /api/jobs/:id - Get job status
 * DELETE /api/jobs/:id - Cancel/delete job info
 */

const express = require('express');
const router = express.Router();
const { getJob, deleteJob } = require('../services/jobManager');

router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    return res.status(400).json({ error: true, message: 'Invalid job ID' });
  }

  const job = getJob(id);
  if (!job) {
    return res.status(404).json({ error: true, message: 'Job not found or expired' });
  }

  // Return safe subset
  res.json({
    success: true,
    data: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      speed: job.speed,
      eta: job.eta,
      message: job.message,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  deleteJob(id);
  res.json({ success: true, message: 'Job removed' });
});

module.exports = router;
