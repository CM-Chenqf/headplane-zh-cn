export const locales = ["en", "zh-CN"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-CN";
}

// Only English and Simplified Chinese are shipped. All Chinese browser
// preferences use Simplified Chinese; unsupported languages fall back to English.
export function negotiateLocale(header: string | null): Locale {
  const candidates = (header ?? "").split(",").flatMap((entry, index) => {
    const match =
      /^\s*([a-z]{1,8}(?:-[a-z0-9]{1,8})*|\*)(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?\s*$/i.exec(
        entry,
      );
    if (!match) return [];
    const quality = match[2] === undefined ? 1 : Number(match[2]);
    const language = match[1].toLowerCase().split("-")[0];
    if (quality === 0 || (language !== "en" && language !== "zh")) return [];
    return [{ locale: language === "zh" ? ("zh-CN" as const) : ("en" as const), quality, index }];
  });
  candidates.sort((a, b) => b.quality - a.quality || a.index - b.index);
  return candidates[0]?.locale ?? defaultLocale;
}
