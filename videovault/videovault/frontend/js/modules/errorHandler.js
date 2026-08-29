/**
 * Error Handler Module
 * Maps error codes to user-friendly Persian messages
 */

const MESSAGES = {
  MISSING_URL: 'لطفاً یک لینک وارد کنید.',
  INVALID_URL: 'فرمت لینک نامعتبر است.',
  INVALID_SCHEME: 'فقط لینک‌های HTTP و HTTPS مجاز هستند.',
  BLOCKED_HOST: 'دسترسی به این آدرس مجاز نیست.',
  URL_TOO_LONG: 'لینک بیش از حد طولانی است.',
  PRIVATE_CONTENT: 'این محتوا خصوصی است و قابل دریافت نیست.',
  AUTH_REQUIRED: 'این محتوا نیاز به ورود دارد. فقط محتوای مجاز خود را استفاده کنید.',
  DRM_PROTECTED: 'این محتوا دارای محافظت DRM است و قابل دانلود نیست.',
  UNSUPPORTED_URL: 'این لینک پشتیبانی نمی‌شود یا نامعتبر است.',
  ANALYZE_FAILED: 'تحلیل ویدیو ناموفق بود. لینک را بررسی کنید یا بعداً تلاش کنید.',
  DOWNLOAD_FAILED: 'دانلود ناموفق بود. محتوا ممکن است محافظت‌شده یا در دسترس نباشد.',
  INVALID_FORMAT: 'فرمت خروجی انتخاب‌شده پشتیبانی نمی‌شود.',
  RATE_LIMIT: 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید.',
  NETWORK: 'خطای شبکه. اتصال اینترنت خود را بررسی کنید.',
  TIMEOUT: 'زمان درخواست به پایان رسید. دوباره تلاش کنید.',
  DEFAULT: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
};

export function getErrorMessage(err) {
  if (!err) return MESSAGES.DEFAULT;
  if (err.code && MESSAGES[err.code]) return MESSAGES[err.code];
  if (err.status === 429) return MESSAGES.RATE_LIMIT;
  if (err.name === 'TypeError' && err.message.includes('fetch')) return MESSAGES.NETWORK;
  if (err.message) return err.message;
  return MESSAGES.DEFAULT;
}

export function logError(context, err) {
  console.error(`[${context}]`, err?.code || '', err?.message || err);
}
