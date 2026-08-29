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
  if (f.resolution) parts.push(f.resolution);
  else if (f.height) parts.push(`${f.height}p`);
  if (f.fps) parts.push(`${Math.round(f.fps)}fps`);
  if (f.ext) parts.push(f.ext.toUpperCase());
  if (f.note) parts.push(f.note);
  const size = formatSize(f.filesize);
  if (size) parts.push(size);
  return parts.join(' · ') || f.formatId || 'Unknown';
}

export function renderFormatsList(container, formats, selectedId, onSelect) {
  container.innerHTML = '';

  if (!formats || formats.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:0.5rem;">فرمتی یافت نشد. از گزینه پیش‌فرض استفاده می‌شود.</p>';
    return;
  }

  formats.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'format-item' + (f.formatId === selectedId ? ' selected' : '');
    btn.dataset.formatId = f.formatId;

    const sizeStr = formatSize(f.filesize);
    const metaParts = [];
    if (f.vcodec) metaParts.push(f.vcodec.split('.')[0]);
    if (f.acodec) metaParts.push(f.acodec.split('.')[0]);
    if (sizeStr) metaParts.push(sizeStr);

    btn.innerHTML = `
      <span class="format-item__radio"></span>
      <span class="format-item__info">
        <span class="format-item__label">${buildFormatLabel(f)}</span>
        <span class="format-item__meta">${metaParts.join(' · ')}</span>
      </span>
    `;

    btn.addEventListener('click', () => {
      container.querySelectorAll('.format-item').forEach((el) => el.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(f);
    });

    container.appendChild(btn);
  });
}

export { formatDuration, formatSize };
