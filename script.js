'use strict';

/* ============================================================
   PinBoard — Immersive Hero + Unsplash-ready (secure)
   کلید API در فرانت نیست. برای Unsplash واقعی از پروکسی بک‌اند استفاده کن.
   ============================================================ */

const CATEGORIES = [
  { id: 'all',          label: 'همه',           color: '#e6e6e6', subcategories: [] },
  { id: 'architecture', label: 'معماری',       color: '#7ea1ff', subcategories: ['خانه‌های مینیمال', 'فضای داخلی', 'نمای بیرونی', 'فضای عمومی'] },
  { id: 'jewelry',      label: 'جواهرات',      color: '#f2c14e', subcategories: ['انگشتر', 'گردنبند', 'دستبند', 'گوشواره'] },
  { id: 'fashion',      label: 'فشن',          color: '#f26fa1', subcategories: ['استریت‌استایل', 'لباس مجلسی', 'اکسسوری', 'کفش'] },
  { id: 'travel',       label: 'سفر',          color: '#4fd3c4', subcategories: ['طبیعت‌گردی', 'شهری', 'ساحلی', 'کوهستان'] },
  { id: 'tech',         label: 'تکنولوژی',     color: '#8f7bff', subcategories: ['گجت', 'رابط کاربری', 'هوش مصنوعی', 'ست‌آپ کار'] },
  { id: 'ideas',        label: 'ایده‌ها',      color: '#ff9a5a', subcategories: ['الهام‌بخش', 'دیزاین گرافیک', 'بردهای الهام', 'یادداشت‌ها'] },
];
const categoryById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

/* تصاویر واقعی Unsplash (بدون نیاز به API Key برای نمایش) */
const U = (id, w = 480, h = 640) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

let MOCK_PINS = [
  { id: 'p1',  title: 'آپارتمان مینیمال با نور طبیعی', category: 'architecture', subcategory: 'فضای داخلی', tags: ['مینیمال', 'نور طبیعی', 'چوب'], note: 'ترکیب چوب روشن و دیوار سفید خیلی آرامش‌بخشه.', sourceUrl: 'https://unsplash.com/photos/2FdI0QJYI6Y', imageUrl: U('photo-1616486338812-3dadae4b4ace') },
  { id: 'p2',  title: 'نمای بتنی خانه‌ی مدرن', category: 'architecture', subcategory: 'نمای بیرونی', tags: ['بتن‌نما', 'مدرن'], note: '', sourceUrl: 'https://unsplash.com/photos/IuLgi9PWETU', imageUrl: U('photo-1600585154340-be6161a56a0c') },
  { id: 'p3',  title: 'انگشتر ساده طلای رزگلد', category: 'jewelry', subcategory: 'انگشتر', tags: ['رزگلد', 'ساده', 'روزمره'], note: 'برای ست کردن با ساعت مینیمال.', sourceUrl: 'https://unsplash.com/photos/example', imageUrl: U('photo-1605100804763-247f995f9880') },
  { id: 'p4',  title: 'گردنبند زنجیری ظریف', category: 'jewelry', subcategory: 'گردنبند', tags: ['ظریف', 'نقره'], note: '', sourceUrl: '', imageUrl: U('photo-1599643478518-a784e5dc4c8f') },
  { id: 'p5',  title: 'استایل خیابانی پاییزی', category: 'fashion', subcategory: 'استریت‌استایل', tags: ['پاییز', 'لایه‌بندی', 'کژوال'], note: 'ایده برای ست پاییزی با کت بلند.', sourceUrl: '', imageUrl: U('photo-1483985988355-763728e1935b') },
  { id: 'p6',  title: 'کفش اسنیکر سفید کلاسیک', category: 'fashion', subcategory: 'کفش', tags: ['سنیکر', 'سفید', 'کلاسیک'], note: '', sourceUrl: '', imageUrl: U('photo-1542291026-7eec264c27ff') },
  { id: 'p7',  title: 'ساحل صخره‌ای در غروب', category: 'travel', subcategory: 'ساحلی', tags: ['غروب', 'دریا', 'آرامش'], note: 'مقصد احتمالی تعطیلات تابستون.', sourceUrl: '', imageUrl: U('photo-1507525428034-b723cf961d3e') },
  { id: 'p8',  title: 'کوچه‌های قدیمی شهر تاریخی', category: 'travel', subcategory: 'شهری', tags: ['معماری قدیمی', 'گردشگری'], note: '', sourceUrl: '', imageUrl: U('photo-1523906834658-6e24ef2386f9') },
  { id: 'p9',  title: 'ست‌آپ کار مینیمال با مک‌بوک', category: 'tech', subcategory: 'ست‌آپ کار', tags: ['ست‌آپ', 'مینیمال', 'دسکتاپ'], note: 'الهام برای چیدمان میز کار جدید.', sourceUrl: '', imageUrl: U('photo-1498050108023-c5249f4df085') },
  { id: 'p10', title: 'رابط کاربری اپلیکیشن موسیقی', category: 'tech', subcategory: 'رابط کاربری', tags: ['UI', 'دارک‌مود', 'اپ'], note: 'الگوی خوب برای پلیر موزیک.', sourceUrl: '', imageUrl: U('photo-1611162617474-5b21e11e161d') },
  { id: 'p11', title: 'برد الهام برای پروژه‌ی برندینگ', category: 'ideas', subcategory: 'بردهای الهام', tags: ['برندینگ', 'رنگ‌بندی'], note: '', sourceUrl: '', imageUrl: U('photo-1558655146-d09347e92766') },
  { id: 'p12', title: 'تایپوگرافی خلاقانه برای پوستر', category: 'ideas', subcategory: 'دیزاین گرافیک', tags: ['تایپوگرافی', 'پوستر'], note: 'برای پروژه‌ی بعدی پوستر کنسرت.', sourceUrl: '', imageUrl: U('photo-1561070791-2526d30994b5') },
  { id: 'p13', title: 'دستبند چرمی مینیمال', category: 'jewelry', subcategory: 'دستبند', tags: ['چرم', 'مردانه'], note: '', sourceUrl: '', imageUrl: U('photo-1611591437281-460bfbe1220a') },
  { id: 'p14', title: 'کلبه‌ی چوبی میان جنگل', category: 'architecture', subcategory: 'خانه‌های مینیمال', tags: ['چوب', 'طبیعت', 'کلبه'], note: 'ایده برای خانه‌ی ییلاقی.', sourceUrl: '', imageUrl: U('photo-1449158743715-0a90ebb6d2d8') },
  { id: 'p15', title: 'مسیر پیاده‌روی کوهستانی', category: 'travel', subcategory: 'کوهستان', tags: ['طبیعت', 'پیاده‌روی'], note: '', sourceUrl: '', imageUrl: U('photo-1464822759023-fed622ff2c3b') },
  { id: 'p16', title: 'اکسسوری کیف دستی چرم', category: 'fashion', subcategory: 'اکسسوری', tags: ['چرم', 'کیف'], note: '', sourceUrl: '', imageUrl: U('photo-1548036328-c085560c53e5') },
];

/* ---------- API Layer (secure, multi-source) ---------- */
const API_CONFIG = {
  // در پروداکشن: 'https://your-backend.com/api'
  // کلید Unsplash / Pexels فقط در بک‌اند
  proxyBase: '',
};

const PinAPI = {
  async getAll() {
    return [...MOCK_PINS];
  },
  async create(pinData) {
    const newPin = { id: 'p' + Date.now(), ...pinData };
    MOCK_PINS = [newPin, ...MOCK_PINS];
    return newPin;
  },
  async searchExternal(query, source = 'unsplash') {
    const q = (query || '').trim();
    if (!q) return [];

    if (API_CONFIG.proxyBase) {
      try {
        const res = await fetch(`${API_CONFIG.proxyBase}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, query: q, per_page: 12 }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        return Array.isArray(data.results) ? data.results : [];
      } catch (e) {
        console.warn('[PinAPI] proxy failed', e);
        return [];
      }
    }

    // Demo mode (بدون کلید): نتایج شبیه‌سازی با تصاویر Unsplash واقعی
    const seeds = [
      'photo-1506905925346-21bda4d32df4',
      'photo-1469474968028-56623f02e42e',
      'photo-1441974231531-c6227db76b6e',
      'photo-1470071459604-3b5ec3a7fe05',
      'photo-1426604966848-d7adac402bff',
      'photo-1472214103451-9374bd1c798e',
    ];
    return seeds.map((id, i) => ({
      id: `ext-${source}-${i}-${Date.now()}`,
      title: `${q} · ${source === 'unsplash' ? 'Unsplash' : 'Pexels'} ${i + 1}`,
      category: 'ideas',
      subcategory: 'الهام‌بخش',
      tags: [q, source, 'جستجو'],
      note: `نتیجه دمو از ${source}. برای نتایج واقعی، proxyBase را به بک‌اند خود وصل کن.`,
      sourceUrl: source === 'unsplash'
        ? `https://unsplash.com/s/photos/${encodeURIComponent(q)}`
        : `https://www.pexels.com/search/${encodeURIComponent(q)}/`,
      imageUrl: U(id, 480, 320 + (i % 4) * 80),
      _external: true,
      _source: source,
    }));
  },
};

/* ---------- State ---------- */
const state = {
  pins: [],
  externalPins: [],
  activeCategory: 'all',
  searchTerm: '',
  isExternalMode: false,
};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const dom = {
  navBar: $('navBar'),
  heroCats: $('heroCats'),
  galleryFilters: $('galleryFilters'),
  masonryGrid: $('masonryGrid'),
  emptyState: $('emptyState'),
  emptyTitle: $('emptyTitle'),
  emptyDesc: $('emptyDesc'),
  clearFiltersBtn: $('clearFiltersBtn'),
  sectionTitle: $('sectionTitle'),
  resultCount: $('resultCount'),
  heroSearch: $('heroSearch'),
  heroSearchBtn: $('heroSearchBtn'),
  scrollToGallery: $('scrollToGallery'),
  openAddPin: $('openAddPin'),
  modalOverlay: $('modalOverlay'),
  closeModal: $('closeModal'),
  cancelForm: $('cancelForm'),
  pinForm: $('pinForm'),
  formErrorBanner: $('formErrorBanner'),
  inputImage: $('inputImage'),
  imgPreview: $('imgPreview'),
  inputTitle: $('inputTitle'),
  inputCategory: $('inputCategory'),
  inputSubcategory: $('inputSubcategory'),
  inputTags: $('inputTags'),
  tagPreview: $('tagPreview'),
  inputNote: $('inputNote'),
  inputSource: $('inputSource'),
  toast: $('toast'),
};

/* ---------- Utils ---------- */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
let toastTimer;
function showToast(msg) {
  if (!dom.toast) return;
  dom.toast.textContent = msg;
  dom.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2800);
}

/* ---------- Nav ---------- */
function updateNav() {
  if (dom.navBar) dom.navBar.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

if (dom.scrollToGallery) {
  dom.scrollToGallery.addEventListener('click', () => {
    $('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- Chips ---------- */
function renderCategoryChips() {
  const make = (cat, cls) =>
    `<button class="${cls} ${state.activeCategory === cat.id ? 'active' : ''}"
             data-category="${cat.id}" role="tab"
             aria-selected="${state.activeCategory === cat.id}">
       ${escapeHtml(cat.label)}
     </button>`;
  if (dom.heroCats) dom.heroCats.innerHTML = CATEGORIES.map(c => make(c, 'hero-chip')).join('');
  if (dom.galleryFilters) dom.galleryFilters.innerHTML = CATEGORIES.map(c => make(c, 'g-chip')).join('');
}

function setActiveCategory(id) {
  state.activeCategory = id;
  if (state.isExternalMode && id !== 'all') {
    state.isExternalMode = false;
    state.externalPins = [];
  }
  render();
  if (window.scrollY < window.innerHeight * 0.5) {
    $('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

dom.heroCats?.addEventListener('click', e => {
  const btn = e.target.closest('[data-category]');
  if (btn) setActiveCategory(btn.dataset.category);
});
dom.galleryFilters?.addEventListener('click', e => {
  const btn = e.target.closest('[data-category]');
  if (btn) setActiveCategory(btn.dataset.category);
});

/* ---------- Search scoring ---------- */
function scorePin(pin, tokens) {
  if (!tokens.length) return 1;
  const cat = categoryById[pin.category];
  const fields = [
    { t: (pin.title || '').toLowerCase(), w: 4 },
    { t: (pin.tags || []).join(' ').toLowerCase(), w: 3 },
    { t: (pin.subcategory || '').toLowerCase(), w: 2 },
    { t: (cat?.label || '').toLowerCase(), w: 2 },
    { t: (pin.note || '').toLowerCase(), w: 1 },
  ];
  let score = 0, hits = 0;
  for (const tok of tokens) {
    let hit = false;
    for (const f of fields) {
      if (f.t.includes(tok)) { score += f.w; hit = true; }
    }
    if (hit) hits++;
  }
  return hits < tokens.length ? 0 : score;
}

function getFilteredPins() {
  const tokens = state.searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);

  let list = state.isExternalMode ? state.externalPins : state.pins;

  if (state.activeCategory !== 'all') {
    list = list.filter(p => p.category === state.activeCategory);
  }
  if (!tokens.length) return list;

  return list
    .map(p => ({ p, s: scorePin(p, tokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.p);
}

function pinCardHtml(pin) {
  const cat = categoryById[pin.category] || { label: pin.category, color: '#999' };
  const tags = (pin.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const ext = pin._external
    ? `<span class="pin-badge" style="--cat-color:#4fd3c4;inset-inline-start:auto;inset-inline-end:10px">
         <span class="dot"></span>${escapeHtml(pin._source || 'ext')}
       </span>` : '';
  return `
    <article class="pin-card" data-id="${pin.id}" tabindex="0" role="group" aria-label="${escapeHtml(pin.title)}">
      <div class="pin-media">
        <img class="pin-img" src="${escapeHtml(pin.imageUrl)}" alt="${escapeHtml(pin.title)}" loading="lazy"
             onerror="this.parentElement.classList.add('is-broken')" />
        <div class="pin-fallback">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span>تصویر بارگذاری نشد</span>
        </div>
        <span class="pin-badge" style="--cat-color:${cat.color}"><span class="dot"></span>${escapeHtml(cat.label)}</span>
        ${ext}
        <div class="pin-overlay">
          <div class="tag-row">${tags}</div>
          <button class="pin-save" type="button">ذخیره</button>
        </div>
      </div>
      <div class="pin-body">
        <h3 class="pin-title">${escapeHtml(pin.title)}</h3>
        <div class="pin-meta">
          <span class="pin-cat">${escapeHtml(cat.label)}${pin.subcategory ? ' · <b>' + escapeHtml(pin.subcategory) + '</b>' : ''}</span>
        </div>
      </div>
    </article>`;
}

function render() {
  renderCategoryChips();

  const cat = categoryById[state.activeCategory];
  if (dom.sectionTitle) {
    dom.sectionTitle.textContent = state.isExternalMode
      ? (state.searchTerm ? `نتایج «${state.searchTerm}»` : 'نتایج جستجو')
      : (cat && cat.id !== 'all' ? cat.label : 'آرشیو شخصی');
  }

  const filtered = getFilteredPins();
  if (dom.resultCount) {
    dom.resultCount.textContent = filtered.length ? `${filtered.length} پین` : '';
  }

  if (!dom.masonryGrid || !dom.emptyState) return;

  if (filtered.length === 0) {
    dom.masonryGrid.hidden = true;
    dom.emptyState.hidden = false;
    if (dom.emptyTitle) {
      dom.emptyTitle.textContent = state.searchTerm
        ? `نتیجه‌ای برای «${state.searchTerm}» پیدا نشد`
        : 'این دسته‌بندی هنوز خالیه';
    }
    if (dom.emptyDesc) {
      dom.emptyDesc.textContent = state.searchTerm
        ? 'کلمه دیگری امتحان کن یا فیلتر را پاک کن.'
        : 'با «افزودن Pin» اولین آیتم را اضافه کن.';
    }
  } else {
    dom.masonryGrid.hidden = false;
    dom.emptyState.hidden = true;
    dom.masonryGrid.innerHTML = filtered.map(pinCardHtml).join('');
  }
}

/* ---------- Search handlers ---------- */
async function doSearch(term, external) {
  const q = (term || '').trim();
  state.searchTerm = q;

  if (!q) {
    state.isExternalMode = false;
    state.externalPins = [];
    render();
    return;
  }

  if (external) {
    showToast('در حال جستجو…');
    try {
      const [u, p] = await Promise.all([
        PinAPI.searchExternal(q, 'unsplash'),
        PinAPI.searchExternal(q, 'pexels'),
      ]);
      // نتایج خارجی + پین‌های محلی مرتبط
      const localHits = state.pins.filter(pin => scorePin(pin, q.toLowerCase().split(/\s+/)) > 0);
      state.externalPins = [...localHits, ...u, ...p];
      state.isExternalMode = true;
      state.activeCategory = 'all';
      render();
      showToast(`${state.externalPins.length} نتیجه`);
    } catch (e) {
      console.error(e);
      showToast('خطا در جستجو');
      state.isExternalMode = false;
      state.externalPins = [];
      render();
    }
  } else {
    state.isExternalMode = false;
    state.externalPins = [];
    render();
  }

  $('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (dom.heroSearch) {
  dom.heroSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch(dom.heroSearch.value, true);
    }
  });
  dom.heroSearch.addEventListener('input', debounce(e => {
    const v = e.target.value;
    if (!v.trim()) {
      state.searchTerm = '';
      state.isExternalMode = false;
      state.externalPins = [];
      render();
      return;
    }
    // تایپ زنده = فیلتر محلی سریع
    doSearch(v, false);
  }, 180));
}
if (dom.heroSearchBtn) {
  dom.heroSearchBtn.addEventListener('click', () => doSearch(dom.heroSearch?.value, true));
}
if (dom.clearFiltersBtn) {
  dom.clearFiltersBtn.addEventListener('click', () => {
    state.searchTerm = '';
    state.activeCategory = 'all';
    state.isExternalMode = false;
    state.externalPins = [];
    if (dom.heroSearch) dom.heroSearch.value = '';
    render();
  });
}

/* ---------- Modal ---------- */
function populateCategorySelect() {
  if (!dom.inputCategory) return;
  dom.inputCategory.innerHTML = '<option value="">انتخاب کن…</option>' +
    CATEGORIES.filter(c => c.id !== 'all')
      .map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join('');
}
function populateSubcategorySelect(catId) {
  if (!dom.inputSubcategory) return;
  const cat = categoryById[catId];
  if (!cat || !cat.subcategories.length) {
    dom.inputSubcategory.innerHTML = '<option value="">—</option>';
    dom.inputSubcategory.disabled = true;
    return;
  }
  dom.inputSubcategory.disabled = false;
  dom.inputSubcategory.innerHTML = '<option value="">اختیاری…</option>' +
    cat.subcategories.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}
dom.inputCategory?.addEventListener('change', () => populateSubcategorySelect(dom.inputCategory.value));

dom.inputImage?.addEventListener('input', debounce(() => {
  const url = dom.inputImage.value.trim();
  if (!dom.imgPreview) return;
  if (!url) {
    dom.imgPreview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>پیش‌نمایش تصویر اینجا نمایش داده می‌شود</span>`;
    return;
  }
  const img = new Image();
  img.onload = () => { dom.imgPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="پیش‌نمایش" />`; };
  img.onerror = () => {
    dom.imgPreview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>این لینک قابل بارگذاری نیست</span>`;
  };
  img.src = url;
}, 400));

dom.inputTags?.addEventListener('input', () => {
  if (!dom.tagPreview) return;
  const tags = parseTags(dom.inputTags.value);
  dom.tagPreview.innerHTML = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
});

function parseTags(raw) {
  return (raw || '').split(/[,،]/).map(t => t.trim()).filter(Boolean);
}
function isValidUrl(v) {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}
function setFieldValid(id, ok) {
  const el = $(id);
  if (el) el.classList.toggle('invalid', !ok);
}
function validateForm() {
  let ok = true;
  const img = dom.inputImage?.value.trim() || '';
  const title = dom.inputTitle?.value.trim() || '';
  const cat = dom.inputCategory?.value || '';
  if (!(img && isValidUrl(img))) { setFieldValid('field-image', false); ok = false; } else setFieldValid('field-image', true);
  if (!title) { setFieldValid('field-title', false); ok = false; } else setFieldValid('field-title', true);
  if (!cat) { setFieldValid('field-category', false); ok = false; } else setFieldValid('field-category', true);
  return ok;
}
function resetForm() {
  dom.pinForm?.reset();
  dom.formErrorBanner?.classList.remove('show');
  if (dom.formErrorBanner) dom.formErrorBanner.textContent = '';
  ['field-image', 'field-title', 'field-category'].forEach(id => setFieldValid(id, true));
  if (dom.imgPreview) {
    dom.imgPreview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>پیش‌نمایش تصویر اینجا نمایش داده می‌شود</span>`;
  }
  if (dom.tagPreview) dom.tagPreview.innerHTML = '';
  populateSubcategorySelect('');
}

let lastFocus = null;
function openModal() {
  lastFocus = document.activeElement;
  if (dom.modalOverlay) dom.modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => dom.inputImage?.focus(), 30);
}
function closeModal() {
  if (dom.modalOverlay) dom.modalOverlay.hidden = true;
  document.body.style.overflow = '';
  resetForm();
  lastFocus?.focus();
}

dom.openAddPin?.addEventListener('click', openModal);
dom.closeModal?.addEventListener('click', closeModal);
dom.cancelForm?.addEventListener('click', closeModal);
dom.modalOverlay?.addEventListener('click', e => { if (e.target === dom.modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && dom.modalOverlay && !dom.modalOverlay.hidden) closeModal();
});

dom.pinForm?.addEventListener('submit', async e => {
  e.preventDefault();
  dom.formErrorBanner?.classList.remove('show');
  if (!validateForm()) {
    if (dom.formErrorBanner) {
      dom.formErrorBanner.textContent = 'لطفاً فیلدهای الزامی را کامل کن.';
      dom.formErrorBanner.classList.add('show');
    }
    return;
  }
  const btn = dom.pinForm.querySelector('.btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'در حال ذخیره…'; }
  try {
    const created = await PinAPI.create({
      title: dom.inputTitle.value.trim(),
      imageUrl: dom.inputImage.value.trim(),
      category: dom.inputCategory.value,
      subcategory: dom.inputSubcategory?.value || '',
      tags: parseTags(dom.inputTags?.value),
      note: dom.inputNote?.value.trim() || '',
      sourceUrl: dom.inputSource?.value.trim() || '',
    });
    state.pins = [created, ...state.pins];
    state.activeCategory = 'all';
    state.searchTerm = '';
    state.isExternalMode = false;
    state.externalPins = [];
    if (dom.heroSearch) dom.heroSearch.value = '';
    render();
    closeModal();
    showToast('Pin با موفقیت اضافه شد ✓');
    $('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch {
    if (dom.formErrorBanner) {
      dom.formErrorBanner.textContent = 'مشکلی پیش آمد. دوباره امتحان کن.';
      dom.formErrorBanner.classList.add('show');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'ذخیره Pin'; }
  }
});

/* ---------- Init ---------- */
async function init() {
  populateCategorySelect();
  populateSubcategorySelect('');
  try {
    state.pins = await PinAPI.getAll();
  } catch (e) {
    console.error('init failed', e);
    state.pins = [];
  }
  render();
}
init();
