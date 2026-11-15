import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStaticHandler, data, RouterContextProvider } from "react-router";
import { describe, expect, test } from "vitest";

import { getErrorMessage } from "~/components/error-banner";
import type { Locale } from "~/i18n/locale";

async function routeError(payload: unknown, status: number) {
  const handler = createStaticHandler([
    {
      path: "/",
      loader: () => {
        throw data(payload, { status });
      },
    },
  ]);
  const result = await handler.query(new Request("http://headplane.test/"), {
    requestContext: new RouterContextProvider(),
  });
  if (result instanceof Response || !result.errors) throw new Error("Expected a routed error");
  return Object.values(result.errors)[0];
}

function describeError(error: unknown, locale: Locale) {
  const result = getErrorMessage(error, locale);
  return {
    title: result.title,
    html: renderToStaticMarkup(createElement("div", null, result.jsxMessage)),
  };
}

describe("localized error diagnostics", () => {
  test.each([401, 403, 500])(
    "keeps API status and raw JSON when translating HTTP %s errors",
    async (status) => {
      const payload = {
        requestUrl: "GET https://headscale.test/api/v1/node",
        statusCode: status,
        rawData: "upstream detail",
        data: { message: "permission denied", code: 7 },
      };
      const error = await routeError(payload, status);
      const chinese = describeError(error, "zh-CN");
      const english = describeError(error, "en");
      expect(chinese.title).toMatch(/错误|无效/);
      expect(english.title).toMatch(/Headscale API/);
      for (const result of [chinese, english]) {
        expect(result.html).toContain("permission denied");
        expect(result.html).toContain("&quot;code&quot;: 7");
      }
      if (status < 500) {
        expect(chinese.html).toContain(payload.requestUrl);
        expect(chinese.html).toContain(String(status));
      } else expect(chinese.html).toContain(String(status));
    },
  );

  test("keeps network details and nested original errors readable in Chinese", async () => {
    const payload = {
      requestUrl: "GET https://headscale.test/api/v1/node",
      errorCode: "ECONNREFUSED",
      errorMessage: "connect ECONNREFUSED 127.0.0.1:8080",
      extraData: { address: "127.0.0.1" },
    };
    const result = describeError(await routeError(payload, 502), "zh-CN");
    expect(result.title).toBe("无法连接到 Headscale API");
    expect(result.html).toContain(payload.requestUrl);
    expect(result.html).toContain(payload.errorMessage);
    expect(result.html).toContain("&quot;address&quot;");
    const nested = describeError(
      new Error("wrapper", { cause: new TypeError("unmodified upstream details <tag>") }),
      "zh-CN",
    );
    expect(nested.title).toBe("错误：TypeError");
    expect(nested.html).toContain("原始诊断信息");
    expect(nested.html).toContain("unmodified upstream details &lt;tag&gt;");
  });
});
