import { beforeAll, afterAll, expect, test } from "vitest";

import { getLocale, setLocale } from "~/i18n/locale.server";
import { action as login } from "~/routes/auth/login/page";
import { action as saveLocale } from "~/routes/util/locale";

import { createTestApp, statusOf, type TestApp } from "../../support/app";

let app: TestApp;
beforeAll(async () => {
  app = await createTestApp({
    headscale: { url: "http://127.0.0.1:1", apiKey: "unused" },
    config: { server: { base_path: "/network/control" } },
  });
});
afterAll(async () => {
  await app?.dispose();
});

test("signed-out visitors can persist a language without a session or redirect", async () => {
  const result = await app.call(saveLocale, "/api/locale", {
    form: { locale: "zh-CN", returnTo: "https://example.com" },
  });
  expect(statusOf(result)).toBe(200);
  const response = result as { data: { locale: string }; init: ResponseInit };
  const headers = new Headers(response.init.headers);
  expect(response.data).toEqual({ locale: "zh-CN" });
  expect(headers.get("Location")).toBeNull();
  const cookie = headers.get("Set-Cookie")!;
  expect(cookie).toContain("Max-Age=31536000");
  expect(cookie).toContain("Path=/");
  expect(
    await getLocale(
      app.request("/login", { headers: { Cookie: cookie.split(";")[0], "Accept-Language": "en" } }),
    ),
  ).toBe("zh-CN");
  await expect(
    app.ctx.auth.require(app.request("/login", { headers: { Cookie: cookie.split(";")[0] } })),
  ).rejects.toThrow("Session cookie is empty");
});

test.each<Record<string, string | string[]>>([
  {},
  { locale: "fr" },
  { locale: "zh-cn" },
  { locale: ["en", "zh-CN"] },
])("refuses malformed preferences %j", async (form) => {
  expect(statusOf(await app.call(saveLocale, "/api/locale", { form }))).toBe(400);
});

test("the preference endpoint does not treat GET as a write", async () => {
  expect(statusOf(await app.call(saveLocale, "/api/locale"))).toBe(405);
});

test("login validation follows browser preferences and a saved English override", async () => {
  const chinese = await app.call(login, "/login", {
    form: {},
    headers: { "Accept-Language": "zh-CN,en;q=0.8" },
  });
  expect(chinese).toEqual({
    success: false,
    message: "请输入 API 密钥。",
    messageKey: "login.error.required",
  });
  const english = await app.call(login, "/login", {
    form: {},
    headers: { Cookie: (await setLocale("en")).split(";")[0], "Accept-Language": "zh-CN" },
  });
  expect(english).toEqual({
    success: false,
    message: "Enter an API key.",
    messageKey: "login.error.required",
  });
});

test("an unreachable Headscale is explained in Chinese", async () => {
  expect(
    await app.call(login, "/login", {
      form: { api_key: "hskey-api-anything" },
      headers: { "Accept-Language": "zh-CN" },
    }),
  ).toEqual({
    success: false,
    message: "无法验证 API 密钥，请查看服务器日志。",
    messageKey: "login.error.unavailable",
  });
});
