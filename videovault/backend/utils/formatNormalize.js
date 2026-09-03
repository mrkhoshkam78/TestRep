/**
 * Normalize yt-dlp / direct format lists into a consistent shape
 */

function mapFormat(f) {
  const vcodec = f.vcodec && f.vcodec !== 'none' ? f.vcodec : null;
  const acodec = f.acodec && f.acodec !== 'none' ? f.acodec : null;
  const protocol = f.protocol || '';
  return {
    formatId: String(f.format_id || f.formatId || 'unknown'),
    ext: f.ext || 'unknown',
    resolution: f.resolution || (f.height ? `${f.width || '?'}x${f.height}` : null),
    height: f.height || null,
    width: f.width || null,
    fps: f.fps || null,
    vcodec,
    acodec,
    filesize: f.filesize || f.filesize_approx || null,
    tbr: f.tbr || null,
    abr: f.abr || null,
    vbr: f.vbr || null,
    protocol,
    note: f.format_note || f.format || null,
    hasVideo: !!vcodec,
    hasAudio: !!acodec,
    isHls: protocol.includes('m3u8') || f.ext === 'm3u8',
    isDash: protocol.includes('dash') || f.ext === 'mpd',
    qualityLabel: buildQualityLabel(f, vcodec, acodec)
  };
}

function buildQualityLabel(f, vcodec, acodec) {
  const parts = [];
  if (f.height) parts.push(`${f.height}p`);
  else if (f.resolution) parts.push(f.resolution);
  if (f.fps && f.fps >= 48) parts.push(`${Math.round(f.fps)}fps`);
  if (f.ext) parts.push(String(f.ext).toUpperCase());
  if (f.format_note) parts.push(f.format_note);
  return parts.join(' · ') || String(f.format_id || 'default');
}

function normalizeInfo(info, providerId) {
  const raw = (info.formats || []).filter((f) => f.url || f.manifest_url || f.fragments);
  const formats = raw.map(mapFormat);

  // Deduplicate by formatId keeping richest entry
  const byId = new Map();
  for (const f of formats) {
    const prev = byId.get(f.formatId);
    if (!prev || (f.filesize || 0) > (prev.filesize || 0)) byId.set(f.formatId, f);
  }
  const unique = Array.from(byId.values());

  const videoFormats = unique
    .filter((f) => f.hasVideo)
    .sort((a, b) => (b.height || 0) - (a.height || 0) || (b.tbr || 0) - (a.tbr || 0));

  const audioFormats = unique
    .filter((f) => f.hasAudio && !f.hasVideo)
    .sort((a, b) => (b.abr || 0) - (a.abr || 0));

  // Prefer progressive (combined) when available
  const combined = unique
    .filter((f) => f.hasVideo && f.hasAudio)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  // Recommended: best combined, else best video (needs merge)
  let recommended = combined[0] || videoFormats[0] || audioFormats[0] || null;
  let needsMerge = false;
  if (recommended && recommended.hasVideo && !recommended.hasAudio) {
    needsMerge = true;
  }

  const thumb =
    info.thumbnail ||
    (Array.isArray(info.thumbnails) && info.thumbnails.length
      ? info.thumbnails[info.thumbnails.length - 1].url
      : null);

  return {
    id: info.id || null,
    title: (info.title || 'Untitled').trim(),
    description: String(info.description || '').slice(0, 500),
    duration: info.duration || null,
    thumbnail: thumb,
    uploader: info.uploader || info.channel || info.creator || null,
    webpageUrl: info.webpage_url || info.original_url || info.url || null,
    extractor: info.extractor || info.extractor_key || providerId,
    provider: providerId,
    isLive: !!(info.is_live || info.live_status === 'is_live'),
    ageLimit: info.age_limit || 0,
    needsMerge,
    recommendedFormatId: recommended ? recommended.formatId : null,
    formats: {
      all: unique.slice(0, 60),
      video: videoFormats.slice(0, 25),
      audio: audioFormats.slice(0, 12),
      combined: combined.slice(0, 20)
    }
  };
}

function sanitizeFilename(name, maxLen = 80) {
  return String(name || 'video')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen) || 'video';
}

module.exports = { mapFormat, normalizeInfo, sanitizeFilename };
