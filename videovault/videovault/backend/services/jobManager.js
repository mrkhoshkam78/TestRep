/**
 * Job Manager
 * In-memory job queue and status tracking
 * For production, use Redis or a proper queue
 */

const { v4: uuidv4 } = require('uuid');

const jobs = new Map();

const JOB_STATUS = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  DOWNLOADING: 'downloading',
  MERGING: 'merging',
  CONVERTING: 'converting',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

function createJob(url, options = {}) {
  const id = uuidv4();
  const job = {
    id,
    url,
    options,
    status: JOB_STATUS.PENDING,
    progress: 0,
    speed: null,
    downloadedBytes: 0,
    totalBytes: null,
    eta: null,
    message: 'Job created',
    result: null,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  jobs.set(id, job);
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, updates, { updatedAt: Date.now() });
  return job;
}

function deleteJob(id) {
  return jobs.delete(id);
}

// Cleanup old jobs from memory (files cleaned by cleanupService)
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > maxAge) {
      jobs.delete(id);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  createJob,
  getJob,
  updateJob,
  deleteJob,
  JOB_STATUS
};
