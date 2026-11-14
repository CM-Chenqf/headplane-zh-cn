import * as v from "valibot";

import { defaultLocale, type Locale } from "~/i18n/locale";
import { translate } from "~/i18n/messages";

export function machineNameSchema(locale: Locale = defaultLocale) {
  const message = translate(locale, "machines.validation.name");
  return v.pipe(v.string(message), v.regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i, message));
}

export const machineName = machineNameSchema();
