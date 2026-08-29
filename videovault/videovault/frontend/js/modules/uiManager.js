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
  els.loadingState().hidden = false;
  setButtonLoading(els.btnAnalyze(), true);
}

export function showError(title, message) {
  hideAllStates();
  els.errorTitle().textContent = title || 'خطا';
  els.errorMessage().textContent = message || '';
  els.errorState().hidden = false;
  setButtonLoading(els.btnAnalyze(), false);
  setButtonLoading(els.btnDownload(), false);
}

export function showResult() {
  hideAllStates();
  els.videoResult().hidden = false;
  setButtonLoading(els.btnAnalyze(), false);
}

export function showProgress() {
  hideAllStates();
  els.progressPanel().hidden = false;
}

export function showSuccess(downloadUrl, message) {
  hideAllStates();
  const btn = els.btnFinalDownload();
  btn.href = downloadUrl;
  if (message) els.successMessage().textContent = message;
  els.successState().hidden = false;
  setButtonLoading(els.btnDownload(), false);
}

export function updateProgress({ progress, speed, eta, message, title }) {
  if (typeof progress === 'number') {
    els.progressFill().style.width = `${progress}%`;
    els.progressPercent().textContent = `${progress}%`;
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
  if (info.thumbnail) {
    els.videoThumb().src = info.thumbnail;
    els.videoThumb().alt = info.title || 'thumbnail';
  }
  const dur = formatDurationFn(info.duration);
  els.videoDuration().textContent = dur || '';
  els.videoDuration().hidden = !dur;
}
