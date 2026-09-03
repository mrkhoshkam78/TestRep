/**
 * UI Manager Module
 * Controls visibility of states and DOM updates
 */

const $ = (id) => document.getElementById(id);

export const els = {
  urlInput: () => $('url-input'),
  btnAnalyze: () => $('btn-analyze'),
  btnPaste: () => $('btn-paste'),
  btnDownload: () => $('btn-download'),
  btnRetry: () => $('btn-retry'),
  btnNew: () => $('btn-new'),
  btnFinalDownload: () => $('btn-final-download'),
  btnHistory: () => $('btn-history'),
  btnClearHistory: () => $('btn-clear-history'),
  btnTheme: () => $('btn-theme'),
  loadingState: () => $('loading-state'),
  errorState: () => $('error-state'),
  errorTitle: () => $('error-title'),
  errorMessage: () => $('error-message'),
  videoResult: () => $('video-result'),
  videoThumb: () => $('video-thumbnail'),
  videoTitle: () => $('video-title'),
  videoUploader: () => $('video-uploader'),
  videoProvider: () => $('video-provider'),
  videoDesc: () => $('video-description'),
  videoDuration: () => $('video-duration'),
  formatsList: () => $('formats-list'),
  outputFormat: () => $('output-format'),
  progressPanel: () => $('progress-panel'),
  progressFill: () => $('progress-fill'),
  progressPercent: () => $('progress-percent'),
  progressSpeed: () => $('progress-speed'),
  progressEta: () => $('progress-eta'),
  progressMessage: () => $('progress-message'),
  progressTitle: () => $('progress-title'),
  successState: () => $('success-state'),
  successMessage: () => $('success-message'),
  historySection: () => $('history-section'),
  historyList: () => $('history-list'),
  historyEmpty: () => $('history-empty'),
  urlInputSection: () => $('url-input-section')
};

export function hideAllStates() {
  const ids = [
    'loading-state', 'error-state', 'video-result',
    'progress-panel', 'success-state', 'history-section'
  ];
  ids.forEach((id) => {
    const el = $(id);
    if (el) el.hidden = true;
  });
}

export function showLoading() {
  hideAllStates();
  els.urlInputSection().hidden = false;
  els.loadingState().hidden = false;
  setButtonLoading(els.btnAnalyze(), true);
}

export function showError(title, message) {
  hideAllStates();
  els.urlInputSection().hidden = false;
  els.errorTitle().textContent = title || 'خطا';
  els.errorMessage().textContent = message || '';
  els.errorState().hidden = false;
  setButtonLoading(els.btnAnalyze(), false);
  setButtonLoading(els.btnDownload(), false);
}

export function showResult() {
  hideAllStates();
  els.urlInputSection().hidden = false;
  els.videoResult().hidden = false;
  setButtonLoading(els.btnAnalyze(), false);
  setButtonLoading(els.btnDownload(), false);
}

export function showProgress() {
  hideAllStates();
  els.urlInputSection().hidden = true;
  els.progressPanel().hidden = false;
}

export function showSuccess(downloadUrl, message, displayName) {
  hideAllStates();
  els.urlInputSection().hidden = true;
  const btn = els.btnFinalDownload();
  btn.href = downloadUrl;
  if (displayName) btn.setAttribute('download', displayName);
  else btn.setAttribute('download', '');
  if (message) els.successMessage().textContent = message;
  els.successState().hidden = false;
  setButtonLoading(els.btnDownload(), false);
}

export function updateProgress({ progress, speed, eta, message, title }) {
  if (typeof progress === 'number') {
    const clamped = Math.max(0, Math.min(100, progress));
    els.progressFill().style.width = `${clamped}%`;
    els.progressPercent().textContent = `${clamped}%`;
  }
  if (speed !== undefined) els.progressSpeed().textContent = speed || '';
  if (eta !== undefined) els.progressEta().textContent = eta ? `ETA ${eta}` : '';
  if (message) els.progressMessage().textContent = message;
  if (title) els.progressTitle().textContent = title;
}

export function setButtonLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector('.btn__text');
  const loader = btn.querySelector('.btn__loader');
  btn.disabled = loading;
  if (text) text.hidden = loading;
  if (loader) loader.hidden = !loading;
}

export function fillVideoInfo(info, formatDurationFn) {
  els.videoTitle().textContent = info.title || 'بدون عنوان';
  els.videoUploader().textContent = info.uploader || '';
  els.videoProvider().textContent = info.provider || info.extractor || '';
  els.videoDesc().textContent = info.description || '';

  const thumb = els.videoThumb();
  if (info.thumbnail) {
    thumb.hidden = false;
    thumb.src = info.thumbnail;
    thumb.alt = info.title || 'thumbnail';
    thumb.onerror = () => { thumb.hidden = true; };
  } else {
    thumb.removeAttribute('src');
    thumb.hidden = true;
  }

  const dur = formatDurationFn(info.duration);
  els.videoDuration().textContent = dur || '';
  els.videoDuration().hidden = !dur;
}

const THEME_KEY = 'videovault_theme';

export function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
}

export function initTheme() {
  let saved = 'dark';
  try { saved = localStorage.getItem(THEME_KEY) || 'dark'; } catch { /* ignore */ }
  applyTheme(saved);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
