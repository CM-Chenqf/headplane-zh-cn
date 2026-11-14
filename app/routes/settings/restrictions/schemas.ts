import * as v from "valibot";

import { defaultLocale, type Locale } from "~/i18n/locale";
import { createTranslator } from "~/i18n/messages";

export const restrictionTypes = ["domain", "group", "user"] as const;
export type RestrictionType = (typeof restrictionTypes)[number];

function isHostname(value: string) {
  try {
    return new URL(`http://${value}`).hostname === value;
  } catch {
    return false;
  }
}

export function restrictionSchemas(locale: Locale = defaultLocale) {
  const t = createTranslator(locale);
  return {
    domain: v.pipe(
      v.string(t("restrictions.validation.domain")),
      v.trim(),
      v.nonEmpty(t("restrictions.validation.domain")),
      v.check(isHostname, t("restrictions.validation.hostname")),
    ),
    group: v.pipe(
      v.string(t("restrictions.validation.group")),
      v.trim(),
      v.nonEmpty(t("restrictions.validation.group")),
    ),
    user: v.pipe(
      v.string(t("restrictions.validation.user")),
      v.trim(),
      v.nonEmpty(t("restrictions.validation.user")),
    ),
  };
}
