'use strict';

/* ============================================================
   PinBoard — منطق برنامه (Immersive Hero edition)
   ساختار API-ready: لایه‌ی PinAPI بعداً با فراخوانی‌های واقعی
   Pinterest / Pexels جایگزین می‌شود بدون تغییر رندر/فیلتر/فرم.
   ============================================================ */

/* ---------------------------------------------------------
   1) پیکربندی دسته‌بندی‌ها
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
   2) داده‌های Mock
   --------------------------------------------------------- */
const HEIGHT_VARIANTS = [300, 340, 380, 420, 460, 500, 540, 320, 400, 440];
function h(seed) { return HEIGHT_VARIANTS[seed % HEIGHT_VARIANTS.length]; }
function img(seed) { return `https://picsum.photos/seed/pinboard-${seed}/480/${h(seed)}`; }

let MOCK_PINS = [
  { id: 'p1',  title: 'آپارتمان مینیمال با نور طبیعی',      category: 'architecture', subcategory: 'فضای داخلی',   tags: ['مینیمال', 'نور طبیعی', 'چوب'],         note: 'ترکیب چوب روشن و دیوار سفید خیلی آرامش‌بخشه.', sourceUrl: 'https://pinterest.com/pin/1001', imageUrl: img(1) },
  { id: 'p2',  title: 'نمای بتنی خانه‌ی مدرن',               category: 'architecture', subcategory: 'نمای بیرونی',  tags: ['بتن‌نما', 'مدرن'],                      note: '', sourceUrl: 'https://pinterest.com/pin/1002', imageUrl: img(2) },
  { id: 'p3',  title: 'انگشتر ساده طلای رزگلد',               category: 'jewelry',      subcategory: 'انگشتر',       tags: ['رزگلد', 'ساده', 'روزمره'],              note: 'برای ست کردن با ساعت مینیمال.', sourceUrl: 'https://pinterest.com/pin/1003', imageUrl: img(3) },
  { id: 'p4',  title: 'گردنبند زنجیری ظریف',                  category: 'jewelry',      subcategory: 'گردنبند',      tags: ['ظریف', 'نقره'],                         note: '', sourceUrl: 'https://pinterest.com/pin/1004', imageUrl: img(4) },
  { id: 'p5',  title: 'استایل خیابانی پاییزی',                category: 'fashion',      subcategory: 'استریت‌استایل', tags: ['پاییز', 'لایه‌بندی', 'کژوال'],          note: 'ایده برای ست پاییزی با کت بلند.', sourceUrl: 'https://pinterest.com/pin/1005', imageUrl: img(5) },
  { id: 'p6',  title: 'کفش اسنیکر سفید کلاسیک',               category: 'fashion',      subcategory: 'کفش',          tags: ['سنیکر', 'سفید', 'کلاسیک'],              note: '', sourceUrl: 'https://pinterest.com/pin/1006', imageUrl: img(6) },
  { id: 'p7',  title: 'ساحل صخره‌ای در غروب',                 category: 'travel',       subcategory: 'ساحلی',        tags: ['غروب', 'دریا', 'آرامش'],                note: 'مقصد احتمالی تعطیلات تابستون.', sourceUrl: 'https://pinterest.com/pin/1007', imageUrl: img(7) },
  { id: 'p8',  title: 'کوچه‌های قدیمی شهر تاریخی',            category: 'travel',       subcategory: 'شهری',         tags: ['معماری قدیمی', 'گردشگری'],              note: '', sourceUrl: 'https://pinterest.com/pin/1008', imageUrl: img(8) },
  { id: 'p9',  title: 'ست‌آپ کار مینیمال با مک‌بوک',           category: 'tech',         subcategory: 'ست‌آپ کار',    tags: ['ست‌آپ', 'مینیمال', 'دسکتاپ'],           note: 'الهام برای چیدمان میز کار جدید.', sourceUrl: 'https://pinterest.com/pin/1009', imageUrl: img(9) },
  { id: 'p10', title: 'رابط کاربری اپلیکیشن موسیقی',          category: 'tech',         subcategory: 'رابط کاربری',  tags: ['UI', 'دارک‌مود', 'اپ'],                 note: 'الگوی خوب برای پلیر موزیک.', sourceUrl: 'https://pinterest.com/pin/1010', imageUrl: img(10) },
  { id: 'p11', title: 'برد الهام برای پروژه‌ی برندینگ',       category: 'ideas',        subcategory: 'بردهای الهام', tags: ['برندینگ', 'رنگ‌بندی'],                  note: '', sourceUrl: 'https://pinterest.com/pin/1011', imageUrl: img(11) },
  { id: 'p12', title: 'تایپوگرافی خلاقانه برای پوستر',        category: 'ideas',        subcategory: 'دیزاین گرافیک', tags: ['تایپوگرافی', 'پوستر'],                 note: 'برای پروژه‌ی بعدی پوستر کنسرت.', sourceUrl: 'https://pinterest.com/pin/1012', imageUrl: img(12) },
  { id: 'p13', title: 'دستبند چرمی مینیمال',                  category: 'jewelry',      subcategory: 'دستبند',       tags: ['چرم', 'مردانه'],                        note: '', sourceUrl: 'https://pinterest.com/pin/1013', imageUrl: img(13) },
  { id: 'p14', title: 'کلبه‌ی چوبی میان جنگل',                 category: 'architecture', subcategory: 'خانه‌های مینیمال', tags: ['چوب', 'طبیعت', 'کلبه'],           note: 'ایده برای خانه‌ی ییلاقی.', sourceUrl: 'https://pinterest.com/pin/1014', imageUrl: img(14) },
  { id: 'p15', title: 'مسیر پیاده‌روی کوهستانی',               category: 'travel',       subcategory: 'کوهستان',      tags: ['طبیعت', 'پیاده‌روی'],                   note: '', sourceUrl: 'https://pinterest.com/pin/1015', imageUrl: img(15) },
  { id: 'p16', title: 'اکسسوری کیف دستی چرم',                  category: 'fashion',      subcategory: 'اکسسوری',      tags: ['چرم', 'کیف'],                          note: '', sourceUrl: 'https://pinterest.com/pin/1016', imageUrl: img(16) },
];

/* ---------------------------------------------------------
   3) لایه‌ی داده (PinAPI) — آماده برای جایگزینی با API واقعی
   --------------------------------------------------------- */
const PinAPI = {
  async getAll() {
    // TODO(pinterest-api): GET /v5/pins
    return Promise.resolve([...MOCK_PINS]);
  },
  async create(pinData) {
    // TODO(pinterest-api): POST /v5/pins
    const newPin = {
      id: 'p' + Date.now(),
      ...pinData,
    };
    MOCK_PINS = [newPin, ...MOCK_PINS];
    return Promise.resolve(newPin);
  },
  // Placeholder for future external search
  async searchExternal(query, source = 'pinterest') {
    // TODO: integrate Pinterest / Pexels search APIs
    console.info(`[PinAPI] external search stub: "${query}" via ${source}`);
    return [];
  },
};

/* ---------------------------------------------------------
   4) State
   --------------------------------------------------------- */
const state = {
  pins: [],
  activeCategory: 'all',
  searchTerm: '',
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
  toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2600);
}

/* ---------------------------------------------------------
   7) Nav scroll effect + smooth scroll
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
   8) Category chips (hero + gallery)
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

  // Hero chips (skip "all" or include)
  dom.heroCats.innerHTML = CATEGORIES.map(c => makeChip(c, 'hero-chip')).join('');

  // Gallery filter chips
  dom.galleryFilters.innerHTML = CATEGORIES.map(c => makeChip(c, 'g-chip')).join('');
}

function setActiveCategory(catId) {
  state.activeCategory = catId;
  render();
  // Scroll gallery into view if coming from hero
  if (window.scrollY < window.innerHeight * 0.6) {
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
   9) Filter + render grid
   --------------------------------------------------------- */
function getFilteredPins() {
  const term = state.searchTerm.trim().toLowerCase();
  return state.pins.filter(pin => {
    if (state.activeCategory !== 'all' && pin.category !== state.activeCategory) return false;
    if (!term) return true;
    const cat = categoryById[pin.category];
    const haystack = [
      pin.title,
      cat ? cat.label : '',
      pin.subcategory,
      ...(pin.tags || []),
    ].join(' ').toLowerCase();
    return haystack.includes(term);
  });
}

function pinCardHtml(pin) {
  const cat = categoryById[pin.category] || { label: pin.category, color: '#999' };
  const tagsHtml = (pin.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
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
  dom.sectionTitle.textContent = activeCat && activeCat.id !== 'all'
    ? activeCat.label
    : 'آرشیو شخصی';

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
   10) Search (hero)
   --------------------------------------------------------- */
function applySearch(term) {
  state.searchTerm = term;
  render();
  document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

dom.heroSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applySearch(dom.heroSearch.value);
  }
});
dom.heroSearchBtn.addEventListener('click', () => {
  applySearch(dom.heroSearch.value);
});

// Live local filter while typing (debounced)
dom.heroSearch.addEventListener('input', debounce((e) => {
  state.searchTerm = e.target.value;
  render();
}, 220));

dom.clearFiltersBtn.addEventListener('click', () => {
  state.searchTerm = '';
  state.activeCategory = 'all';
  dom.heroSearch.value = '';
  render();
});

/* ---------------------------------------------------------
   11) Modal – add pin
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
  return raw.split(',').map(t => t.trim()).filter(Boolean);
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
