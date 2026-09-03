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
  AUTH_REQUIRED: 'این محتوا نیاز به ورود / احراز هویت دارد. فقط محتوای مجاز خود را استفاده کنید.',
  DRM_PROTECTED: 'این محتوا دارای محافظت DRM است و قابل دانلود نیست.',
  PAYWALL: 'این محتوا پشت دیوار پرداخت یا اشتراک است.',
  GEO_RESTRICTED: 'این محتوا در منطقه فعلی در دسترس نیست (محدودیت جغرافیایی).',
  UNAVAILABLE: 'ویدیو موجود نیست، حذف شده یا لینک منقضی شده است.',
  RATE_LIMITED: 'منبع درخواست‌ها را محدود کرده است. کمی صبر کنید و دوباره تلاش کنید.',
  UNSUPPORTED_URL: 'این لینک پشتیبانی نمی‌شود یا نامعتبر است.',
  FORMAT_UNAVAILABLE: 'فرمت درخواستی برای این رسانه موجود نیست. کیفیت دیگری را امتحان کنید.',
  LIVE_NOT_SUPPORTED: 'پخش زنده برای دانلود پشتیبانی نمی‌شود.',
  ANALYZE_FAILED: 'تحلیل ویدیو ناموفق بود. لینک را بررسی کنید یا بعداً تلاش کنید.',
  DOWNLOAD_FAILED: 'دانلود ناموفق بود. محتوا ممکن است محافظت‌شده یا موقتاً در دسترس نباشد.',
  TIMEOUT: 'زمان درخواست به پایان رسید. دوباره تلاش کنید.',
  INVALID_FORMAT: 'فرمت خروجی انتخاب‌شده پشتیبانی نمی‌شود.',
  RATE_LIMIT: 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید.',
  NETWORK: 'خطای شبکه. اتصال اینترنت خود را بررسی کنید.',
  YTDLP_MISSING: 'موتور دانلود روی سرور نصب نیست. با مدیر سیستم تماس بگیرید.',
  FFMPEG_MISSING: 'FFmpeg روی سرور نصب نیست و ادغام فایل ممکن نیست.',
  JOB_NOT_FOUND: 'وضعیت این دانلود پیدا نشد یا منقضی شده است.',
  DEFAULT: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
};

export function getErrorMessage(err) {
  if (!err) return MESSAGES.DEFAULT;
  if (err.code && MESSAGES[err.code]) return MESSAGES[err.code];
  if (err.status === 429) return MESSAGES.RATE_LIMITED;
  if (err.name === 'TypeError' && String(err.message || '').includes('fetch')) return MESSAGES.NETWORK;
  if (err.message) return err.message;
  return MESSAGES.DEFAULT;
}

export function logError(context, err) {
  console.error(`[${context}]`, err?.code || '', err?.message || err);
}
