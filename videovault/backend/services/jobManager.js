/**
 * Job Manager
 * Queue + status tracking for download pipeline
 * Statuses: queued → extracting → downloading → processing → completed | failed
 */

const { v4: uuidv4 } = require('uuid');

const jobs = new Map();

const JOB_STATUS = {
  QUEUED: 'queued',
  EXTRACTING: 'extracting',
  DOWNLOADING: 'downloading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  // legacy aliases kept for UI compatibility
  PENDING: 'queued',
  ANALYZING: 'extracting',
  MERGING: 'processing',
  CONVERTING: 'processing'
};

function createJob(url, options = {}) {
  const id = uuidv4();
  const job = {
    id,
    url,
    options,
    status: JOB_STATUS.QUEUED,
    progress: 0,
    speed: null,
    downloadedBytes: 0,
    totalBytes: null,
    eta: null,
    message: 'Job queued',
    title: options.title || null,
    provider: options.provider || null,
    result: null,
    error: null,
    errorCode: null,
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

function listJobs(limit = 50) {
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

// Memory cleanup (files cleaned by cleanupService)
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > maxAge) jobs.delete(id);
  }
}, 30 * 60 * 1000);

module.exports = {
  createJob,
  getJob,
  updateJob,
  deleteJob,
  listJobs,
  JOB_STATUS
};
