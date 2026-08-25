import type { Locale } from "./config";

// Date / time formatting — locale-aware
export function formatDate(
  iso: string | Date,
  locale: Locale,
  opts: { timeZone: string; dateFormat: string; timeFormat: string },
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const tz = opts.timeZone === "auto" || !opts.timeZone ? undefined : opts.timeZone;
  const localeStr = locale === "ja" ? "ja-JP" : "en-US";

  let dateOpts: Intl.DateTimeFormatOptions = {};
  switch (opts.dateFormat) {
    case "YYYY/MM/DD":
      dateOpts = { year: "numeric", month: "2-digit", day: "2-digit" };
      break;
    case "MM/DD/YYYY":
      dateOpts = { year: "numeric", month: "2-digit", day: "2-digit" };
      break;
    case "DD/MM/YYYY":
      dateOpts = { year: "numeric", month: "2-digit", day: "2-digit" };
      break;
    default:
      dateOpts = { year: "numeric", month: "short", day: "numeric" };
  }

  let timeOpts: Intl.DateTimeFormatOptions = {};
  if (opts.timeFormat === "24-hour") timeOpts = { hour: "2-digit", minute: "2-digit", hour12: false };
  else if (opts.timeFormat === "12-hour") timeOpts = { hour: "2-digit", minute: "2-digit", hour12: true };
  else timeOpts = { hour: "2-digit", minute: "2-digit" };

  try {
    const datePart = new Intl.DateTimeFormat(localeStr, { ...dateOpts, timeZone: tz }).format(d);
    const timePart = new Intl.DateTimeFormat(localeStr, { ...timeOpts, timeZone: tz }).format(d);
    return `${datePart} ${timePart}`;
  } catch {
    return d.toLocaleString(localeStr);
  }
}

export function formatDateOnly(iso: string | Date, locale: Locale, timeZone: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const tz = timeZone === "auto" || !timeZone ? undefined : timeZone;
  const localeStr = locale === "ja" ? "ja-JP" : "en-US";
  try {
    return new Intl.DateTimeFormat(localeStr, { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz }).format(d);
  } catch {
    return d.toLocaleDateString(localeStr);
  }
}

// Relative time — Intl.RelativeTimeFormat
export function formatRelativeTime(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const isPast = diff >= 0;
  const localeStr = locale === "ja" ? "ja" : "en";

  const minutes = Math.floor(abs / 60000);
  if (minutes < 1) return locale === "ja" ? "たった今" : "just now";
  if (minutes < 60) {
    const v = isPast ? -minutes : minutes;
    try {
      return new Intl.RelativeTimeFormat(localeStr, { numeric: "auto" }).format(v, "minute");
    } catch {
      return locale === "ja" ? `${minutes}分前` : `${minutes} minutes ago`;
    }
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const v = isPast ? -hours : hours;
    try {
      return new Intl.RelativeTimeFormat(localeStr, { numeric: "auto" }).format(v, "hour");
    } catch {
      return locale === "ja" ? `${hours}時間前` : `${hours} hours ago`;
    }
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    const v = isPast ? -days : days;
    try {
      return new Intl.RelativeTimeFormat(localeStr, { numeric: "auto" }).format(v, "day");
    } catch {
      return locale === "ja" ? `${days}日前` : `${days} days ago`;
    }
  }
  return formatDateOnly(iso, locale, "auto");
}

export function formatNumber(n: number, locale: Locale): string {
  const localeStr = locale === "ja" ? "ja-JP" : "en-US";
  try {
    return new Intl.NumberFormat(localeStr).format(n);
  } catch {
    return String(n);
  }
}
