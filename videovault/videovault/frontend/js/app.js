/**
 * VideoVault Frontend Application
 * Entry point - wires modules together
 */

import { analyzeUrl, startDownload, getJobStatus } from './modules/apiClient.js';
import { getErrorMessage, logError } from './modules/errorHandler.js';
import { getHistory, addToHistory, clearHistory, removeFromHistory } from './modules/storageManager.js';
import { renderFormatsList, formatDuration } from './modules/formatManager.js';
import {
  els, hideAllStates, showLoading, showError, showResult,
  showProgress, showSuccess, updateProgress, setButtonLoading, fillVideoInfo
} from './modules/uiManager.js';

// ---------- App State ----------
let currentInfo = null;
let selectedFormat = null;
let currentJobId = null;
let pollTimer = null;
let activeTab = 'video';

// ---------- Init ----------
function init() {
  bindEvents();
  // Empty state is default (hero visible)
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
  });
  els.btnNew().addEventListener('click', resetToInput);

  els.btnHistory().addEventListener('click', toggleHistory);
  els.btnClearHistory().addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      refreshFormatsList();
    });
  });

  // Output format change
  els.outputFormat().addEventListener('change', () => {
    if (els.outputFormat().value === 'mp3') {
      activeTab = 'audio';
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === 'audio');
      });
      refreshFormatsList();
    }
  });
}

// ---------- Analyze ----------
async function onAnalyze() {
  const url = els.urlInput().value.trim();
  if (!url) {
    showError('لینک خالی', 'لطفاً یک لینک معتبر وارد کنید.');
    return;
  }

  showLoading();
  currentInfo = null;
  selectedFormat = null;

  try {
    const res = await analyzeUrl(url);
    currentInfo = res.data;
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
    : (currentInfo.formats?.combined?.length
        ? currentInfo.formats.combined
        : currentInfo.formats?.video || []);

  // Default select first
  if (formats.length && !selectedFormat) {
    selectedFormat = formats[0];
  }

  renderFormatsList(
    els.formatsList(),
    formats,
    selectedFormat?.formatId,
    (f) => { selectedFormat = f; }
  );
}

// ---------- Download ----------
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
      audioOnly
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
  pollTimer = setInterval(async () => {
    try {
      const res = await getJobStatus(jobId);
      const job = res.data;

      updateProgress({
        progress: job.progress,
        speed: job.speed,
        eta: job.eta,
        message: job.message,
        title: statusTitle(job.status)
      });

      if (job.status === 'completed' && job.result) {
        stopPolling();
        // Save to history
        addToHistory({
          title: currentInfo?.title || 'ویدیو',
          url: currentInfo?.webpageUrl || els.urlInput().value,
          downloadUrl: job.result.downloadUrl,
          format: job.result.format,
          provider: currentInfo?.provider
        });
        showSuccess(job.result.downloadUrl);
      } else if (job.status === 'failed') {
        stopPolling();
        showError('دانلود ناموفق', job.error || getErrorMessage({ code: 'DOWNLOAD_FAILED' }));
      }
    } catch (err) {
      // Keep polling on transient errors
      logError('Poll', err);
    }
  }, 1500);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function statusTitle(status) {
  const map = {
    pending: 'در صف انتظار...',
    analyzing: 'در حال تحلیل...',
    downloading: 'در حال دانلود...',
    merging: 'در حال ادغام صوت و تصویر...',
    converting: 'در حال تبدیل فرمت...',
    completed: 'تکمیل شد',
    failed: 'ناموفق'
  };
  return map[status] || 'در حال پردازش...';
}

// ---------- History ----------
function toggleHistory() {
  const section = els.historySection();
  if (!section.hidden) {
    section.hidden = true;
    return;
  }
  hideAllStates();
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
    li.innerHTML = `
      <span class="history__item-title" title="${item.title}">${item.title}</span>
      <span class="history__item-date">${date}</span>
      <button class="btn-icon" data-index="${index}" title="حذف">×</button>
    `;
    li.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromHistory(index);
      renderHistory();
    });
    if (item.downloadUrl) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        window.open(item.downloadUrl, '_blank');
      });
    }
    ul.appendChild(li);
  });
}

// ---------- Reset ----------
function resetToInput() {
  stopPolling();
  currentInfo = null;
  selectedFormat = null;
  currentJobId = null;
  hideAllStates();
  els.urlInput().value = '';
  els.urlInputSection().hidden = false;
  setButtonLoading(els.btnAnalyze(), false);
  setButtonLoading(els.btnDownload(), false);
}

// Start
init();
