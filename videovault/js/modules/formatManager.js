/**
 * Format Manager Module
 * Handles format selection UI and logic
 */

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildFormatLabel(f) {
  const parts = [];
  if (f.height) parts.push(`${f.height}p`);
  else if (f.resolution) parts.push(f.resolution);
  if (f.fps && f.fps >= 48) parts.push(`${Math.round(f.fps)}fps`);
  if (f.ext) parts.push(String(f.ext).toUpperCase());
  if (f.note) parts.push(f.note);
  const size = formatSize(f.filesize);
  if (size) parts.push(size);
  if (f.hasVideo && !f.hasAudio) parts.push('نیاز به ادغام صدا');
  return parts.join(' · ') || f.formatId || 'Unknown';
}

export function mergeVideoFormats(info) {
  const combined = info?.formats?.combined || [];
  const video = info?.formats?.video || [];
  const byId = new Map();
  for (const f of [...combined, ...video]) {
    if (!byId.has(f.formatId)) byId.set(f.formatId, f);
  }
  return Array.from(byId.values()).sort(
    (a, b) => (b.height || 0) - (a.height || 0) || (b.tbr || 0) - (a.tbr || 0)
  );
}

export function renderFormatsList(container, formats, selectedId, onSelect) {
  container.innerHTML = '';

  if (!formats || formats.length === 0) {
    const p = document.createElement('p');
    p.className = 'formats__empty';
    p.textContent = 'فرمتی یافت نشد. از گزینه پیش‌فرض استفاده می‌شود.';
    container.appendChild(p);
    return;
  }

  const validSelected = formats.some((f) => f.formatId === selectedId)
    ? selectedId
    : formats[0].formatId;

  formats.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'format-item' + (f.formatId === validSelected ? ' selected' : '');
    btn.dataset.formatId = f.formatId;

    const sizeStr = formatSize(f.filesize);
    const metaParts = [];
    if (f.vcodec) metaParts.push(f.vcodec.split('.')[0]);
    if (f.acodec) metaParts.push(f.acodec.split('.')[0]);
    if (sizeStr) metaParts.push(sizeStr);

    const label = document.createElement('span');
    label.className = 'format-item__label';
    label.textContent = buildFormatLabel(f);

    const meta = document.createElement('span');
    meta.className = 'format-item__meta';
    meta.textContent = metaParts.join(' · ');

    const info = document.createElement('span');
    info.className = 'format-item__info';
    info.appendChild(label);
    info.appendChild(meta);

    const radio = document.createElement('span');
    radio.className = 'format-item__radio';

    btn.appendChild(radio);
    btn.appendChild(info);

    btn.addEventListener('click', () => {
      container.querySelectorAll('.format-item').forEach((el) => el.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(f);
    });

    container.appendChild(btn);
  });

  if (validSelected !== selectedId) {
    const match = formats.find((f) => f.formatId === validSelected);
    if (match) onSelect(match);
  }
}

export { formatDuration, formatSize };
