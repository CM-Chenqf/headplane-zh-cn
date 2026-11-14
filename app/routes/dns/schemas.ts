import * as v from "valibot";

import { defaultLocale, type Locale } from "~/i18n/locale";
import { createTranslator } from "~/i18n/messages";

export function dnsSchemas(locale: Locale = defaultLocale) {
  const t = createTranslator(locale);
  return {
    nameserver: v.pipe(
      v.string(t("dns.validation.nameserver")),
      v.trim(),
      v.ip(t("dns.validation.nameserver")),
    ),
    recordValue: {
      A: v.pipe(v.string(t("dns.validation.ipv4")), v.trim(), v.ipv4(t("dns.validation.ipv4"))),
      AAAA: v.pipe(v.string(t("dns.validation.ipv6")), v.trim(), v.ipv6(t("dns.validation.ipv6"))),
    },
  };
}
