import { expect, test } from "vitest";

import { dnsSchemas } from "~/routes/dns/schemas";
import { fieldValidator, parseValues } from "~/utils/form";

test.for(["en", "zh-CN"] as const)(
  "%s DNS servers keep IP-only validation and trim whitespace",
  (locale) => {
    const { nameserver } = dnsSchemas(locale);
    for (const address of ["1.1.1.1", "2001:db8::53", "::1"]) {
      expect(parseValues(nameserver, ` ${address} `)).toEqual({ ok: true, data: address });
      expect(fieldValidator(nameserver)(address)).toBeNull();
    }
    const message =
      locale === "en" ? "Enter an IPv4 or IPv6 address." : "请输入 IPv4 或 IPv6 地址。";
    for (const value of [
      "dns.example.com",
      "https://dns.example/dns-query",
      "999.1.1.1",
      " ",
      ["1.1.1.1"],
      undefined,
    ]) {
      expect(parseValues(nameserver, value)).toEqual({ ok: false, errors: { form: message } });
      expect(fieldValidator(nameserver)(value)).toBe(message);
    }
  },
);

test.for(["en", "zh-CN"] as const)(
  "%s DNS record validation keeps A and AAAA address families separate",
  (locale) => {
    const { recordValue } = dnsSchemas(locale);
    expect(parseValues(recordValue.A, " 100.64.0.1 ")).toEqual({ ok: true, data: "100.64.0.1" });
    expect(parseValues(recordValue.AAAA, " fd7a::1 ")).toEqual({ ok: true, data: "fd7a::1" });
    for (const [type, value, message] of [
      ["A", "fd7a::1", locale === "en" ? "Enter an IPv4 address." : "请输入 IPv4 地址。"],
      ["AAAA", "100.64.0.1", locale === "en" ? "Enter an IPv6 address." : "请输入 IPv6 地址。"],
    ] as const) {
      expect(parseValues(recordValue[type], value)).toEqual({
        ok: false,
        errors: { form: message },
      });
      expect(fieldValidator(recordValue[type])(value)).toBe(message);
    }
  },
);
