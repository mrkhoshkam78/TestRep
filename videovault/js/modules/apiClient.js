/**
 * API Client Module
 * Handles all communication with backend
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.code = data.code || (res.status === 429 ? 'RATE_LIMITED' : 'REQUEST_ERROR');
    throw err;
  }

  return data;
}

export async function analyzeUrl(url) {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
}

export async function startDownload(url, options = {}) {
  return request('/download', {
    method: 'POST',
    body: JSON.stringify({ url, ...options })
  });
}

export async function getJobStatus(jobId) {
  return request(`/jobs/${jobId}`);
}

export async function deleteJob(jobId) {
  return request(`/jobs/${jobId}`, { method: 'DELETE' });
}
