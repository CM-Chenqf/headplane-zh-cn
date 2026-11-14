import * as v from "valibot";

import { defaultLocale, type Locale } from "~/i18n/locale";
import { translate } from "~/i18n/messages";
import { validateUsername } from "~/utils/user";

export function usernameSchema(locale: Locale = defaultLocale) {
  const message = translate(locale, "users.validation.username");
  return v.pipe(
    v.string(message),
    v.check((name) => validateUsername(name) === undefined, message),
  );
}

export const username = usernameSchema();
