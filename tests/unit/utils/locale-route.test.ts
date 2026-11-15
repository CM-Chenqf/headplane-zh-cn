import { createStaticHandler, RouterContextProvider } from "react-router";
import { describe, expect, test } from "vitest";

import { getLocale } from "~/i18n/locale.server";
import { action } from "~/routes/util/locale";

const handler = createStaticHandler([{ id: "locale", path: "/api/locale", action }]);

async function submit(body: URLSearchParams, method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST") {
  const result = await handler.query(
    new Request("http://headplane.test/api/locale", { method, body }),
    {
      requestContext: new RouterContextProvider(),
    },
  );
  if (result instanceof Response) throw new Error(`Unexpected navigation: ${result.status}`);
  return result;
}

describe("language preference endpoint", () => {
  test("sets only the preference cookie and ignores caller-supplied redirects", async () => {
    const result = await submit(
      new URLSearchParams({ locale: "zh-CN", returnTo: "https://attacker.test" }),
    );
    expect(result.statusCode).toBe(200);
    expect(result.actionData).toEqual({ locale: { locale: "zh-CN" } });
    const headers = result.actionHeaders.locale;
    expect(headers.get("Location")).toBeNull();
    const cookies = headers.getSetCookie();
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatch(/^headplane_locale=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);
    expect(cookies[0]).toMatch(/SameSite=Lax/i);
    expect(
      await getLocale(
        new Request("http://headplane.test", {
          headers: { Cookie: cookies[0].split(";")[0], "Accept-Language": "en" },
        }),
      ),
    ).toBe("zh-CN");
  });

  test.each([
    new URLSearchParams(),
    new URLSearchParams({ locale: "fr" }),
    new URLSearchParams("locale=en&locale=zh-CN"),
  ])(
    "rejects missing, unsupported, or duplicate preferences without setting cookies: %s",
    async (body) => {
      const result = await submit(body);
      expect(result.statusCode).toBe(400);
      expect(result.actionHeaders.locale?.has("Set-Cookie") ?? false).toBe(false);
    },
  );

  test.each(["PUT", "PATCH", "DELETE"] as const)(
    "rejects %s without changing a preference",
    async (method) => {
      const result = await submit(new URLSearchParams({ locale: "zh-CN" }), method);
      expect(result.statusCode).toBe(405);
      expect(result.actionHeaders.locale.get("Allow")).toBe("POST");
      expect(result.actionHeaders.locale.has("Set-Cookie")).toBe(false);
    },
  );
});
