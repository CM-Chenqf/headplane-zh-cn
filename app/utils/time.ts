import { defaultLocale, type Locale } from "~/i18n/locale";
import { translate } from "~/i18n/messages";

/** Keeps the release line's minute/hour/day and 30-day-month thresholds. */
export function formatTimeDelta(date: Date, locale: Locale = defaultLocale): string {
  const diffMs = new Date().getTime() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const unit = (value: number, name: string) =>
    new Intl.NumberFormat(locale, {
      style: "unit",
      unit: name,
      unitDisplay: "long",
      useGrouping: false,
    }).format(value);
  let parts: string[];
  if (minutes < 60) {
    parts = [unit(minutes, "minute")];
  } else if (hours < 24) {
    parts = [unit(hours, "hour")];
    if (minutes % 60) parts.push(unit(minutes % 60, "minute"));
  } else if (days < 30) {
    parts = [unit(days, "day")];
    if (hours % 24) parts.push(unit(hours % 24, "hour"));
  } else {
    parts = [unit(months, "month")];
    if (days % 30) parts.push(unit(days % 30, "day"));
  }
  return translate(locale, "machines.timeAgo", {
    duration: new Intl.ListFormat(locale, { style: "short", type: "unit" }).format(parts),
  });
}
