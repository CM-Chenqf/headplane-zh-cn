import { describe, expect, test } from "vitest";

import { negotiateLocale } from "~/i18n/locale";
import { getLocale, setLocale } from "~/i18n/locale.server";
import { messages } from "~/i18n/messages";

describe("language preferences", () => {
  test.each([
    [null, "en"],
    ["de-DE,zh-CN;q=0.8,en;q=0.5", "zh-CN"],
    ["zh-CN;q=0.4,en-US;q=0.9", "en"],
    ["en;q=0.8,zh;q=0.8", "en"],
    ["zh-Hant-TW,en;q=0.9", "zh-CN"],
    ["zh;q=0,en;q=0.7", "en"],
    ["zh;q=2,en", "en"],
    ["zh;q=oops,en", "en"],
    ["zh;q=0.1234,en", "en"],
    ["fr,*,es", "en"],
  ])("negotiates %s as %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });

  test("a saved choice overrides the browser without sharing state between requests", async () => {
    const chinese = (await setLocale("zh-CN")).split(";")[0];
    const english = (await setLocale("en")).split(";")[0];
    const choices = await Promise.all([
      getLocale(
        new Request("http://headplane.test/admin/login", {
          headers: { Cookie: chinese, "Accept-Language": "en" },
        }),
      ),
      getLocale(
        new Request("http://headplane.test/admin/login", {
          headers: { Cookie: english, "Accept-Language": "zh-CN" },
        }),
      ),
      getLocale(
        new Request("http://headplane.test/admin/login", {
          headers: { "Accept-Language": "zh-CN" },
        }),
      ),
    ]);
    expect(choices).toEqual(["zh-CN", "en", "zh-CN"]);
  });

  test.each(["%%%", "bnVsbA==", "ImZyIg==", "e30=", "W10="])(
    "damaged or unsupported cookie %s falls back to the browser",
    async (cookie) => {
      expect(
        await getLocale(
          new Request("http://headplane.test/admin/login", {
            headers: { Cookie: `headplane_locale=${cookie}`, "Accept-Language": "zh-CN" },
          }),
        ),
      ).toBe("zh-CN");
    },
  );
});

test("translated sentences preserve every interpolation placeholder", () => {
  for (const [key, english] of Object.entries(messages.en)) {
    const translated = messages["zh-CN"][key as keyof typeof messages.en];
    const placeholders = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    expect(placeholders(translated), key).toEqual(placeholders(english));
  }
});
