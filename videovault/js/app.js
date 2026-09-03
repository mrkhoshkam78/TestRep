/**
 * VideoVault Frontend Application
 * Entry point - wires modules together
 */

import { analyzeUrl, startDownload, getJobStatus } from './modules/apiClient.js';
import { getErrorMessage, logError } from './modules/errorHandler.js';
import { getHistory, addToHistory, clearHistory, removeFromHistory } from './modules/storageManager.js';
import { renderFormatsList, formatDuration, mergeVideoFormats } from './modules/formatManager.js';
import {
  els, hideAllStates, showLoading, showError, showResult,
  showProgress, showSuccess, updateProgress, setButtonLoading, fillVideoInfo,
  initTheme, toggleTheme
} from './modules/uiManager.js';

let currentInfo = null;
let selectedFormat = null;
let currentJobId = null;
let pollTimer = null;
let pollInFlight = false;
let pollFailures = 0;
let activeTab = 'video';

function init() {
  initTheme();
  bindEvents();
}

function bindEvents() {
  els.btnAnalyze().addEventListener('click', onAnalyze);
  els.urlInput().addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onAnalyze();
  });

  els.btnPaste().addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) els.urlInput().value = text.trim();
    } catch {
      // Clipboard permission denied - ignore
    }
  });

  els.btnDownload().addEventListener('click', onDownload);
  els.btnRetry().addEventListener('click', () => {
    hideAllStates();
    els.urlInputSection().hidden = false;
    if (currentInfo) {
      showResult();
    }
  });
  els.btnNew().addEventListener('click', resetToInput);

  els.btnHistory().addEventListener('click', toggleHistory);
  els.btnClearHistory().addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });

  const themeBtn = els.btnTheme();
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      selectedFormat = null;
      if (activeTab === 'audio') {
        els.outputFormat().value = 'mp3';
      } else if (els.outputFormat().value === 'mp3') {
        els.outputFormat().value = 'mp4';
      }
      refreshFormatsList();
    });
  });

  els.outputFormat().addEventListener('change', () => {
    if (els.outputFormat().value === 'mp3') {
      activeTab = 'audio';
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === 'audio');
      });
      selectedFormat = null;
      refreshFormatsList();
    } else if (activeTab === 'audio') {
      activeTab = 'video';
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === 'video');
      });
      selectedFormat = null;
      refreshFormatsList();
    }
  });
}

async function onAnalyze() {
  const url = els.urlInput().value.trim();
  if (!url) {
    showError('لینک خالی', 'لطفاً یک لینک معتبر وارد کنید.');
    return;
  }

  stopPolling();
  showLoading();
  currentInfo = null;
  selectedFormat = null;
  currentJobId = null;

  try {
    const res = await analyzeUrl(url);
    currentInfo = res.data;
    selectedFormat = null;
    fillVideoInfo(currentInfo, formatDuration);
    refreshFormatsList();
    showResult();
  } catch (err) {
    logError('Analyze', err);
    showError('خطا در تحلیل', getErrorMessage(err));
  }
}

function refreshFormatsList() {
  if (!currentInfo) return;
  const formats = activeTab === 'audio'
    ? (currentInfo.formats?.audio || [])
    : mergeVideoFormats(currentInfo);

  if (formats.length) {
    const stillValid = selectedFormat && formats.some((f) => f.formatId === selectedFormat.formatId);
    if (!stillValid) selectedFormat = formats[0];
  } else {
    selectedFormat = null;
  }

  renderFormatsList(
    els.formatsList(),
    formats,
    selectedFormat?.formatId,
    (f) => { selectedFormat = f; }
  );
}

async function onDownload() {
  const url = els.urlInput().value.trim() || currentInfo?.webpageUrl;
  if (!url) {
    showError('خطا', 'لینک موجود نیست.');
    return;
  }

  setButtonLoading(els.btnDownload(), true);
  showProgress();
  updateProgress({ progress: 0, message: 'شروع فرآیند دانلود...', title: 'در حال آماده‌سازی' });

  try {
    const outputFormat = els.outputFormat().value;
    const audioOnly = outputFormat === 'mp3' || activeTab === 'audio';

    const res = await startDownload(url, {
      formatId: selectedFormat?.formatId || 'best',
      outputFormat,
      audioOnly,
      title: currentInfo?.title || null
    });

    currentJobId = res.jobId;
    startPolling(currentJobId);
  } catch (err) {
    logError('Download', err);
    showError('خطا در دانلود', getErrorMessage(err));
  }
}

function startPolling(jobId) {
  stopPolling();
  pollFailures = 0;
  pollJob(jobId);
  pollTimer = setInterval(() => pollJob(jobId), 1500);
}

async function pollJob(jobId) {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const res = await getJobStatus(jobId);
    const job = res.data;
    pollFailures = 0;

    updateProgress({
      progress: job.progress,
      speed: job.speed,
      eta: job.eta,
      message: job.message,
      title: statusTitle(job.status)
    });

    if (job.status === 'completed' && job.result) {
      stopPolling();
      addToHistory({
        title: currentInfo?.title || job.result.displayName || 'ویدیو',
        url: currentInfo?.webpageUrl || els.urlInput().value,
        downloadUrl: job.result.downloadUrl,
        format: job.result.format,
        provider: currentInfo?.provider
      });
      showSuccess(
        job.result.downloadUrl,
        'فایل شما آماده دانلود می‌باشد. لینک موقت است و پس از مدتی حذف می‌شود.',
        job.result.displayName
      );
    } else if (job.status === 'failed') {
      stopPolling();
      showError('دانلود ناموفق', job.error || getErrorMessage({ code: job.errorCode || 'DOWNLOAD_FAILED' }));
    }
  } catch (err) {
    pollFailures += 1;
    logError('Poll', err);
    if (pollFailures >= 8) {
      stopPolling();
      showError('خطا در پیگیری دانلود', getErrorMessage(err));
    }
  } finally {
    pollInFlight = false;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  pollInFlight = false;
}

function statusTitle(status) {
  const map = {
    queued: 'در صف انتظار...',
    pending: 'در صف انتظار...',
    extracting: 'در حال استخراج اطلاعات...',
    analyzing: 'در حال استخراج اطلاعات...',
    downloading: 'در حال دانلود...',
    processing: 'در حال پردازش / ادغام...',
    merging: 'در حال ادغام صوت و تصویر...',
    converting: 'در حال تبدیل فرمت...',
    completed: 'تکمیل شد',
    failed: 'ناموفق'
  };
  return map[status] || 'در حال پردازش...';
}

function toggleHistory() {
  const section = els.historySection();
  if (!section.hidden) {
    section.hidden = true;
    els.urlInputSection().hidden = false;
    if (currentInfo) els.videoResult().hidden = false;
    return;
  }
  hideAllStates();
  els.urlInputSection().hidden = true;
  renderHistory();
  section.hidden = false;
}

function renderHistory() {
  const list = getHistory();
  const ul = els.historyList();
  const empty = els.historyEmpty();

  ul.innerHTML = '';
  if (list.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'history__item';
    const date = new Date(item.savedAt).toLocaleDateString('fa-IR');

    const title = document.createElement('span');
    title.className = 'history__item-title';
    title.title = item.title || '';
    title.textContent = item.title || 'ویدیو';

    const dateEl = document.createElement('span');
    dateEl.className = 'history__item-date';
    dateEl.textContent = date;

    const del = document.createElement('button');
    del.className = 'btn-icon';
    del.type = 'button';
    del.title = 'حذف';
    del.textContent = '×';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromHistory(index);
      renderHistory();
    });

    li.appendChild(title);
    li.appendChild(dateEl);
    li.appendChild(del);

    if (item.downloadUrl) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        window.open(item.downloadUrl, '_blank');
      });
    }
    ul.appendChild(li);
  });
}

function resetToInput() {
  stopPolling();
  currentInfo = null;
  selectedFormat = null;
  currentJobId = null;
  activeTab = 'video';
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === 'video');
  });
  if (els.outputFormat()) els.outputFormat().value = 'mp4';
  hideAllStates();
  els.urlInput().value = '';
  els.urlInputSection().hidden = false;
  setButtonLoading(els.btnAnalyze(), false);
  setButtonLoading(els.btnDownload(), false);
}

init();
