import { defaultLocale, type Locale } from "~/i18n/locale";
import { translate } from "~/i18n/messages";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relative = {
  en: new Intl.RelativeTimeFormat("en", { numeric: "auto" }),
  "zh-CN": new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" }),
};

export function formatDateTime(date: Date, locale: Locale = defaultLocale): string {
  return date.toLocaleString(locale);
}

/**
 * Formats the time since a date in its largest unit, e.g. "3 hours ago".
 */
export function formatTimeDelta(date: Date, locale: Locale = defaultLocale): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (seconds >= size) {
      return relative[locale].format(-Math.floor(seconds / size), unit);
    }
  }

  return translate(locale, "time.justNow");
}

/**
 * Formats the time until a date in its largest unit, e.g. "in 4 days".
 */
export function formatTimeUntil(date: Date, locale: Locale = defaultLocale): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (seconds >= size) {
      return relative[locale].format(Math.floor(seconds / size), unit);
    }
  }

  return translate(locale, "time.now");
}
