'use strict';

/* ============================================================
   PinBoard — منطق برنامه (Immersive Hero + Multi-Source API)
   - Unsplash جایگزین منبع قبلی شده (از طریق پروکسی بک‌اند امن)
   - Pexels و منابع دیگر قابل افزودن هستند
   - کلید API هرگز در فرانت‌اند قرار نمی‌گیرد
   - جستجو روی title / note / category / subcategory / tags با امتیازدهی
   ============================================================ */

/* ---------------------------------------------------------
   1) پیکربندی دسته‌بندی‌ها (بدون تغییر)
   --------------------------------------------------------- */
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

/* ---------------------------------------------------------
   2) داده‌های Mock (آرشیو شخصی محلی)
   --------------------------------------------------------- */
const HEIGHT_VARIANTS = [300, 340, 380, 420, 460, 500, 540, 320, 400, 440];
function h(seed) { return HEIGHT_VARIANTS[seed % HEIGHT_VARIANTS.length]; }
function img(seed) { return `https://picsum.photos/seed/pinboard-${seed}/480/${h(seed)}`; }

let MOCK_PINS = [
  { id: 'p1',  title: 'آپارتمان مینیمال با نور طبیعی',      category: 'architecture', subcategory: 'فضای داخلی',   tags: ['مینیمال', 'نور طبیعی', 'چوب'],         note: 'ترکیب چوب روشن و دیوار سفید خیلی آرامش‌بخشه.', sourceUrl: 'https://unsplash.com/photos/example1', imageUrl: img(1) },
  { id: 'p2',  title: 'نمای بتنی خانه‌ی مدرن',               category: 'architecture', subcategory: 'نمای بیرونی',  tags: ['بتن‌نما', 'مدرن'],                      note: '', sourceUrl: 'https://unsplash.com/photos/example2', imageUrl: img(2) },
  { id: 'p3',  title: 'انگشتر ساده طلای رزگلد',               category: 'jewelry',      subcategory: 'انگشتر',       tags: ['رزگلد', 'ساده', 'روزمره'],              note: 'برای ست کردن با ساعت مینیمال.', sourceUrl: 'https://unsplash.com/photos/example3', imageUrl: img(3) },
  { id: 'p4',  title: 'گردنبند زنجیری ظریف',                  category: 'jewelry',      subcategory: 'گردنبند',      tags: ['ظریف', 'نقره'],                         note: '', sourceUrl: 'https://unsplash.com/photos/example4', imageUrl: img(4) },
  { id: 'p5',  title: 'استایل خیابانی پاییزی',                category: 'fashion',      subcategory: 'استریت‌استایل', tags: ['پاییز', 'لایه‌بندی', 'کژوال'],          note: 'ایده برای ست پاییزی با کت بلند.', sourceUrl: 'https://unsplash.com/photos/example5', imageUrl: img(5) },
  { id: 'p6',  title: 'کفش اسنیکر سفید کلاسیک',               category: 'fashion',      subcategory: 'کفش',          tags: ['سنیکر', 'سفید', 'کلاسیک'],              note: '', sourceUrl: 'https://unsplash.com/photos/example6', imageUrl: img(6) },
  { id: 'p7',  title: 'ساحل صخره‌ای در غروب',                 category: 'travel',       subcategory: 'ساحلی',        tags: ['غروب', 'دریا', 'آرامش'],                note: 'مقصد احتمالی تعطیلات تابستون.', sourceUrl: 'https://unsplash.com/photos/example7', imageUrl: img(7) },
  { id: 'p8',  title: 'کوچه‌های قدیمی شهر تاریخی',            category: 'travel',       subcategory: 'شهری',         tags: ['معماری قدیمی', 'گردشگری'],              note: '', sourceUrl: 'https://unsplash.com/photos/example8', imageUrl: img(8) },
  { id: 'p9',  title: 'ست‌آپ کار مینیمال با مک‌بوک',           category: 'tech',         subcategory: 'ست‌آپ کار',    tags: ['ست‌آپ', 'مینیمال', 'دسکتاپ'],           note: 'الهام برای چیدمان میز کار جدید.', sourceUrl: 'https://unsplash.com/photos/example9', imageUrl: img(9) },
  { id: 'p10', title: 'رابط کاربری اپلیکیشن موسیقی',          category: 'tech',         subcategory: 'رابط کاربری',  tags: ['UI', 'دارک‌مود', 'اپ'],                 note: 'الگوی خوب برای پلیر موزیک.', sourceUrl: 'https://unsplash.com/photos/example10', imageUrl: img(10) },
  { id: 'p11', title: 'برد الهام برای پروژه‌ی برندینگ',       category: 'ideas',        subcategory: 'بردهای الهام', tags: ['برندینگ', 'رنگ‌بندی'],                  note: '', sourceUrl: 'https://unsplash.com/photos/example11', imageUrl: img(11) },
  { id: 'p12', title: 'تایپوگرافی خلاقانه برای پوستر',        category: 'ideas',        subcategory: 'دیزاین گرافیک', tags: ['تایپوگرافی', 'پوستر'],                 note: 'برای پروژه‌ی بعدی پوستر کنسرت.', sourceUrl: 'https://unsplash.com/photos/example12', imageUrl: img(12) },
  { id: 'p13', title: 'دستبند چرمی مینیمال',                  category: 'jewelry',      subcategory: 'دستبند',       tags: ['چرم', 'مردانه'],                        note: '', sourceUrl: 'https://unsplash.com/photos/example13', imageUrl: img(13) },
  { id: 'p14', title: 'کلبه‌ی چوبی میان جنگل',                 category: 'architecture', subcategory: 'خانه‌های مینیمال', tags: ['چوب', 'طبیعت', 'کلبه'],           note: 'ایده برای خانه‌ی ییلاقی.', sourceUrl: 'https://unsplash.com/photos/example14', imageUrl: img(14) },
  { id: 'p15', title: 'مسیر پیاده‌روی کوهستانی',               category: 'travel',       subcategory: 'کوهستان',      tags: ['طبیعت', 'پیاده‌روی'],                   note: '', sourceUrl: 'https://unsplash.com/photos/example15', imageUrl: img(15) },
  { id: 'p16', title: 'اکسسوری کیف دستی چرم',                  category: 'fashion',      subcategory: 'اکسسوری',      tags: ['چرم', 'کیف'],                          note: '', sourceUrl: 'https://unsplash.com/photos/example16', imageUrl: img(16) },
];

/* ---------------------------------------------------------
   3) لایه‌ی داده (PinAPI) — Multi-source & secure
   کلیدهای API فقط در بک‌اند نگهداری می‌شوند.
   فرانت فقط به endpoint پروکسی خودتان درخواست می‌زند.
   مثال: POST /api/search { source: 'unsplash', query: '...' }
   --------------------------------------------------------- */
const API_CONFIG = {
  // در پروداکشن این مقدار را به آدرس بک‌اند خود تنظیم کنید
  // مثال: 'https://your-backend.com/api'
  // خالی = فقط جستجوی محلی + حالت دمو
  proxyBase: '',

  // منابع پشتیبانی‌شده (قابل گسترش)
  sources: {
    local:    { label: 'آرشیو شخصی', enabled: true },
    unsplash: { label: 'Unsplash',   enabled: true },
    pexels:   { label: 'Pexels',     enabled: true },
  },
};

const PinAPI = {
  /** دریافت تمام پین‌های محلی (آرشیو شخصی) */
  async getAll() {
    return Promise.resolve([...MOCK_PINS]);
  },

  /** ایجاد پین جدید در آرشیو محلی */
  async create(pinData) {
    const newPin = {
      id: 'p' + Date.now(),
      ...pinData,
    };
    MOCK_PINS = [newPin, ...MOCK_PINS];
    return Promise.resolve(newPin);
  },

  /**
   * جستجوی خارجی از طریق پروکسی بک‌اند (امن)
   * @param {string} query
   * @param {'unsplash'|'pexels'|string} source
   * @returns {Promise<Array>} نتایج نرمال‌شده به شکل pin
   */
  async searchExternal(query, source = 'unsplash') {
    const q = (query || '').trim();
    if (!q) return [];

    // اگر پروکسی تنظیم شده باشد → درخواست واقعی به بک‌اند
    if (API_CONFIG.proxyBase) {
      try {
        const res = await fetch(`${API_CONFIG.proxyBase}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, query: q, per_page: 12 }),
        });
        if (!res.ok) throw new Error(`Proxy error ${res.status}`);
        const data = await res.json();
        // انتظار می‌رود بک‌اند آرایه‌ای از آبجکت‌های نرمال‌شده برگرداند
        return Array.isArray(data.results) ? data.results : [];
      } catch (err) {
        console.warn('[PinAPI] proxy search failed:', err.message);
        return [];
      }
    }

    // --- حالت دمو (بدون بک‌اند): نتایج شبیه‌سازی‌شده از Unsplash-style ---
    // در پروداکشن این بخش حذف می‌شود و فقط پروکسی استفاده می‌گردد.
    console.info(`[PinAPI] demo mode — no proxy. Simulating ${source} results for: "${q}"`);
    return this._demoExternalResults(q, source);
  },

  /** نتایج دمو برای تست UI بدون نیاز به کلید */
  _demoExternalResults(query, source) {
    const seedBase = query.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const count = 6;
    const results = [];
    for (let i = 0; i < count; i++) {
      const seed = seedBase + i * 17;
      results.push({
        id: `ext-${source}-${seed}`,
        title: `${query} — ${source === 'unsplash' ? 'Unsplash' : 'Pexels'} #${i + 1}`,
        category: 'ideas',
        subcategory: 'الهام‌بخش',
        tags: [query, source, 'external'],
        note: `نتیجه شبیه‌سازی‌شده از ${source} (برای تست). در پروداکشن از پروکسی بک‌اند می‌آید.`,
        sourceUrl: source === 'unsplash'
          ? `https://unsplash.com/s/photos/${encodeURIComponent(query)}`
          : `https://www.pexels.com/search/${encodeURIComponent(query)}/`,
        imageUrl: `https://picsum.photos/seed/ext-${seed}/480/${h(seed)}`,
        _external: true,
        _source: source,
      });
    }
    return results;
  },
};

/* ---------------------------------------------------------
   4) State
   --------------------------------------------------------- */
const state = {
  pins: [],           // آرشیو شخصی
  externalPins: [],   // نتایج جستجوی خارجی (موقت)
  activeCategory: 'all',
  searchTerm: '',
  isExternalMode: false, // وقتی جستجوی خارجی انجام شده
};

/* ---------------------------------------------------------
   5) DOM refs
   --------------------------------------------------------- */
const dom = {
  navBar: document.getElementById('navBar'),
  heroCats: document.getElementById('heroCats'),
  galleryFilters: document.getElementById('galleryFilters'),
  masonryGrid: document.getElementById('masonryGrid'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDesc: document.getElementById('emptyDesc'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  sectionTitle: document.getElementById('sectionTitle'),
  resultCount: document.getElementById('resultCount'),
  heroSearch: document.getElementById('heroSearch'),
  heroSearchBtn: document.getElementById('heroSearchBtn'),
  scrollToGallery: document.getElementById('scrollToGallery'),

  openAddPin: document.getElementById('openAddPin'),
  modalOverlay: document.getElementById('modalOverlay'),
  closeModal: document.getElementById('closeModal'),
  cancelForm: document.getElementById('cancelForm'),
  pinForm: document.getElementById('pinForm'),
  formErrorBanner: document.getElementById('formErrorBanner'),

  inputImage: document.getElementById('inputImage'),
  imgPreview: document.getElementById('imgPreview'),
  inputTitle: document.getElementById('inputTitle'),
  inputCategory: document.getElementById('inputCategory'),
  inputSubcategory: document.getElementById('inputSubcategory'),
  inputTags: document.getElementById('inputTags'),
  tagPreview: document.getElementById('tagPreview'),
  inputNote: document.getElementById('inputNote'),
  inputSource: document.getElementById('inputSource'),

  toast: document.getElementById('toast'),
};

/* ---------------------------------------------------------
   6) Utils
   --------------------------------------------------------- */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

let toastTimer = null;
function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2800);
}

/* ---------------------------------------------------------
   7) Nav scroll + smooth scroll
   --------------------------------------------------------- */
function updateNavOnScroll() {
  const scrolled = window.scrollY > 40;
  dom.navBar.classList.toggle('scrolled', scrolled);
}
window.addEventListener('scroll', updateNavOnScroll, { passive: true });
updateNavOnScroll();

dom.scrollToGallery.addEventListener('click', () => {
  document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ---------------------------------------------------------
   8) Category chips
   --------------------------------------------------------- */
function renderCategoryChips() {
  const makeChip = (cat, extraClass = '') => `
    <button class="${extraClass} ${state.activeCategory === cat.id ? 'active' : ''}"
            data-category="${cat.id}"
            role="tab"
            aria-selected="${state.activeCategory === cat.id}">
      ${escapeHtml(cat.label)}
    </button>
  `;
  dom.heroCats.innerHTML = CATEGORIES.map(c => makeChip(c, 'hero-chip')).join('');
  dom.galleryFilters.innerHTML = CATEGORIES.map(c => makeChip(c, 'g-chip')).join('');
}

function setActiveCategory(catId) {
  state.activeCategory = catId;
  // اگر در حالت خارجی هستیم و فیلتر دسته می‌زنیم، به محلی برگرد
  if (state.isExternalMode && catId !== 'all') {
    state.isExternalMode = false;
    state.externalPins = [];
  }
  render();
  if (window.scrollY < window.innerHeight * 0.55) {
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

dom.heroCats.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-category]');
  if (!btn) return;
  setActiveCategory(btn.dataset.category);
});

dom.galleryFilters.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-category]');
  if (!btn) return;
  setActiveCategory(btn.dataset.category);
});

/* ---------------------------------------------------------
   9) جستجوی پیشرفته + فیلتر ترکیبی + امتیازدهی
   --------------------------------------------------------- */
/**
 * امتیاز مرتبط بودن یک پین با عبارت جستجو
 * وزن‌ها: title (۴) > tags (۳) > subcategory (۲) > category (۲) > note (۱)
 */
function scorePin(pin, tokens) {
  if (!tokens.length) return 1;

  const cat = categoryById[pin.category];
  const fields = [
    { text: (pin.title || '').toLowerCase(), weight: 4 },
    { text: (pin.tags || []).join(' ').toLowerCase(), weight: 3 },
    { text: (pin.subcategory || '').toLowerCase(), weight: 2 },
    { text: (cat ? cat.label : '').toLowerCase(), weight: 2 },
    { text: (pin.note || '').toLowerCase(), weight: 1 },
  ];

  let score = 0;
  let matchedTokens = 0;

  for (const token of tokens) {
    let tokenHit = false;
    for (const f of fields) {
      if (f.text.includes(token)) {
        score += f.weight;
        tokenHit = true;
      }
    }
    if (tokenHit) matchedTokens++;
  }

  // همه توکن‌ها باید حداقل یک بار پیدا شوند (AND منطقی)
  if (matchedTokens < tokens.length) return 0;
  return score;
}

function getFilteredPins() {
  const term = state.searchTerm.trim().toLowerCase();
  const tokens = term ? term.split(/\s+/).filter(Boolean) : [];

  // اگر در حالت نتایج خارجی هستیم
  if (state.isExternalMode && state.externalPins.length) {
    let list = state.externalPins;
    if (state.activeCategory !== 'all') {
      list = list.filter(p => p.category === state.activeCategory);
    }
    if (tokens.length) {
      list = list
        .map(p => ({ pin: p, score: scorePin(p, tokens) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.pin);
    }
    return list;
  }

  // آرشیو شخصی + فیلتر ترکیبی
  let list = state.pins;

  if (state.activeCategory !== 'all') {
    list = list.filter(p => p.category === state.activeCategory);
  }

  if (!tokens.length) return list;

  return list
    .map(p => ({ pin: p, score: scorePin(p, tokens) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.pin);
}

function pinCardHtml(pin) {
  const cat = categoryById[pin.category] || { label: pin.category, color: '#999' };
  const tagsHtml = (pin.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const externalBadge = pin._external
    ? `<span class="pin-badge" style="--cat-color:#4fd3c4; inset-inline-start:auto; inset-inline-end:10px;">
         <span class="dot"></span>${escapeHtml(pin._source || 'external')}
       </span>`
    : '';
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
        ${externalBadge}
        <div class="pin-overlay">
          <div class="tag-row">${tagsHtml}</div>
          <button class="pin-save" type="button">ذخیره</button>
        </div>
      </div>
      <div class="pin-body">
        <h3 class="pin-title">${escapeHtml(pin.title)}</h3>
        <div class="pin-meta">
          <span class="pin-cat">${escapeHtml(cat.label)}${pin.subcategory ? ' · <b>' + escapeHtml(pin.subcategory) + '</b>' : ''}</span>
        </div>
      </div>
    </article>
  `;
}

function render() {
  renderCategoryChips();

  const activeCat = categoryById[state.activeCategory];
  if (state.isExternalMode) {
    dom.sectionTitle.textContent = state.searchTerm
      ? `نتایج «${state.searchTerm}»`
      : 'نتایج جستجو';
  } else {
    dom.sectionTitle.textContent = activeCat && activeCat.id !== 'all'
      ? activeCat.label
      : 'آرشیو شخصی';
  }

  const filtered = getFilteredPins();

  dom.resultCount.textContent = filtered.length
    ? `${filtered.length} پین`
    : '';

  if (filtered.length === 0) {
    dom.masonryGrid.hidden = true;
    dom.emptyState.hidden = false;
    if (state.searchTerm.trim()) {
      dom.emptyTitle.textContent = `نتیجه‌ای برای «${state.searchTerm.trim()}» پیدا نشد`;
      dom.emptyDesc.textContent = 'کلمه‌ی دیگری امتحان کن یا فیلتر دسته‌بندی را پاک کن.';
    } else {
      dom.emptyTitle.textContent = 'این دسته‌بندی هنوز خالیه';
      dom.emptyDesc.textContent = 'با دکمه‌ی «افزودن Pin» اولین آیتم این دسته را اضافه کن.';
    }
  } else {
    dom.masonryGrid.hidden = false;
    dom.emptyState.hidden = true;
    dom.masonryGrid.innerHTML = filtered.map(pinCardHtml).join('');
  }
}

/* ---------------------------------------------------------
   10) Search (hero) — محلی + خارجی (Unsplash/Pexels)
   --------------------------------------------------------- */
async function performSearch(term, { external = false } = {}) {
  const q = (term || '').trim();
  state.searchTerm = q;

  if (!q) {
    state.isExternalMode = false;
    state.externalPins = [];
    render();
    return;
  }

  if (external) {
    // جستجوی ترکیبی: ابتدا محلی فیلتر می‌شود، سپس خارجی اضافه می‌گردد
    showToast('در حال جستجو در Unsplash و Pexels…');
    try {
      const [unsplashRes, pexelsRes] = await Promise.all([
        PinAPI.searchExternal(q, 'unsplash'),
        PinAPI.searchExternal(q, 'pexels'),
      ]);
      state.externalPins = [...unsplashRes, ...pexelsRes];
      state.isExternalMode = true;
      state.activeCategory = 'all';
      render();
      showToast(`${state.externalPins.length} نتیجه پیدا شد`);
    } catch (err) {
      console.error(err);
      showToast('خطا در جستجوی خارجی');
      state.isExternalMode = false;
      state.externalPins = [];
      render();
    }
  } else {
    // فقط فیلتر محلی با امتیازدهی
    state.isExternalMode = false;
    state.externalPins = [];
    render();
  }

  document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

dom.heroSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Enter = جستجوی خارجی (Unsplash + Pexels)
    performSearch(dom.heroSearch.value, { external: true });
  }
});

dom.heroSearchBtn.addEventListener('click', () => {
  performSearch(dom.heroSearch.value, { external: true });
});

// تایپ زنده → فقط فیلتر محلی (سریع)
dom.heroSearch.addEventListener('input', debounce((e) => {
  const val = e.target.value;
  if (!val.trim()) {
    state.searchTerm = '';
    state.isExternalMode = false;
    state.externalPins = [];
    render();
    return;
  }
  // هنگام تایپ فقط محلی فیلتر می‌شود تا سریع بماند
  state.searchTerm = val;
  state.isExternalMode = false;
  state.externalPins = [];
  render();
}, 200));

dom.clearFiltersBtn.addEventListener('click', () => {
  state.searchTerm = '';
  state.activeCategory = 'all';
  state.isExternalMode = false;
  state.externalPins = [];
  dom.heroSearch.value = '';
  render();
});

/* ---------------------------------------------------------
   11) Modal – add pin (بدون تغییر منطق اصلی)
   --------------------------------------------------------- */
function populateCategorySelect() {
  dom.inputCategory.innerHTML = '<option value="">انتخاب کن…</option>' +
    CATEGORIES.filter(c => c.id !== 'all')
      .map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join('');
}

function populateSubcategorySelect(catId) {
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

dom.inputCategory.addEventListener('change', () => {
  populateSubcategorySelect(dom.inputCategory.value);
});

dom.inputImage.addEventListener('input', debounce(() => {
  const url = dom.inputImage.value.trim();
  if (!url) {
    dom.imgPreview.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      <span>پیش‌نمایش تصویر اینجا نمایش داده می‌شود</span>`;
    return;
  }
  const testImg = new Image();
  testImg.onload = () => {
    dom.imgPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="پیش‌نمایش" />`;
  };
  testImg.onerror = () => {
    dom.imgPreview.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      <span>این لینک قابل بارگذاری نیست</span>`;
  };
  testImg.src = url;
}, 400));

dom.inputTags.addEventListener('input', () => {
  const tags = parseTags(dom.inputTags.value);
  dom.tagPreview.innerHTML = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
});

function parseTags(raw) {
  return raw.split(/[,،]/).map(t => t.trim()).filter(Boolean);
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function setFieldValid(fieldId, valid) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.toggle('invalid', !valid);
}

function validateForm() {
  let valid = true;
  const imageVal = dom.inputImage.value.trim();
  const titleVal = dom.inputTitle.value.trim();
  const catVal = dom.inputCategory.value;

  const imageOk = imageVal.length > 0 && isValidUrl(imageVal);
  setFieldValid('field-image', imageOk);
  if (!imageOk) valid = false;

  const titleOk = titleVal.length > 0;
  setFieldValid('field-title', titleOk);
  if (!titleOk) valid = false;

  const catOk = catVal.length > 0;
  setFieldValid('field-category', catOk);
  if (!catOk) valid = false;

  return valid;
}

function resetForm() {
  dom.pinForm.reset();
  dom.formErrorBanner.classList.remove('show');
  dom.formErrorBanner.textContent = '';
  ['field-image', 'field-title', 'field-category'].forEach(id => setFieldValid(id, true));
  dom.imgPreview.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
    <span>پیش‌نمایش تصویر اینجا نمایش داده می‌شود</span>`;
  dom.tagPreview.innerHTML = '';
  populateSubcategorySelect('');
}

let lastFocusedEl = null;

function openModal() {
  lastFocusedEl = document.activeElement;
  dom.modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => dom.inputImage.focus(), 30);
}

function closeModalFn() {
  dom.modalOverlay.hidden = true;
  document.body.style.overflow = '';
  resetForm();
  if (lastFocusedEl) lastFocusedEl.focus();
}

dom.openAddPin.addEventListener('click', openModal);
dom.closeModal.addEventListener('click', closeModalFn);
dom.cancelForm.addEventListener('click', closeModalFn);
dom.modalOverlay.addEventListener('click', (e) => {
  if (e.target === dom.modalOverlay) closeModalFn();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !dom.modalOverlay.hidden) closeModalFn();
});

dom.pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  dom.formErrorBanner.classList.remove('show');

  if (!validateForm()) {
    dom.formErrorBanner.textContent = 'لطفاً فیلدهای الزامی (تصویر، عنوان، دسته‌بندی) را کامل کن.';
    dom.formErrorBanner.classList.add('show');
    const firstInvalid = dom.pinForm.querySelector('.invalid input, .invalid select');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const submitBtn = dom.pinForm.querySelector('.btn-primary');
  submitBtn.disabled = true;
  submitBtn.textContent = 'در حال ذخیره…';

  const newPinData = {
    title: dom.inputTitle.value.trim(),
    imageUrl: dom.inputImage.value.trim(),
    category: dom.inputCategory.value,
    subcategory: dom.inputSubcategory.value || '',
    tags: parseTags(dom.inputTags.value),
    note: dom.inputNote.value.trim(),
    sourceUrl: dom.inputSource.value.trim(),
  };

  try {
    const created = await PinAPI.create(newPinData);
    state.pins = [created, ...state.pins];
    state.activeCategory = 'all';
    state.searchTerm = '';
    state.isExternalMode = false;
    state.externalPins = [];
    dom.heroSearch.value = '';
    render();
    closeModalFn();
    showToast('Pin با موفقیت اضافه شد ✓');
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    dom.formErrorBanner.textContent = 'مشکلی در ذخیره‌سازی پیش اومد. دوباره امتحان کن.';
    dom.formErrorBanner.classList.add('show');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'ذخیره Pin';
  }
});

/* ---------------------------------------------------------
   12) Init
   --------------------------------------------------------- */
async function init() {
  populateCategorySelect();
  populateSubcategorySelect('');
  state.pins = await PinAPI.getAll();
  render();
}

init();
