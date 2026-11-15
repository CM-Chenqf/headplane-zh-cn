import { expect, test } from "vitest";

import { setLocale } from "~/i18n/locale.server";
import { loader } from "~/routes/ssh/page";
import { action as saveLocale } from "~/routes/util/locale";

import { createTestApp, statusOf } from "../../support/app";

test("SSH agent failures follow each request language and a saved override without exposing session data", async () => {
  const app = await createTestApp({
    headscale: { url: "http://127.0.0.1:1", apiKey: "unused" },
    config: { server: { base_path: "/network/control" } },
  });
  try {
    const signedIn = await app.signIn("owner");
    const [chinese, english, fallback] = await Promise.all([
      app.call(loader, "/ssh/server", {
        as: signedIn.cookie,
        params: { id: "server" },
        search: "?user=root",
        headers: { "Accept-Language": "zh-TW,en;q=0.8" },
      }),
      app.call(loader, "/ssh/server", {
        as: `${signedIn.cookie}; ${(await setLocale("en")).split(";")[0]}`,
        params: { id: "server" },
        search: "?user=root",
        headers: { "Accept-Language": "zh-CN" },
      }),
      app.call(loader, "/ssh/server", {
        params: { id: "server" },
        headers: { "Accept-Language": "fr" },
      }),
    ]);
    for (const result of [chinese, english, fallback]) expect(statusOf(result)).toBe(400);
    expect(chinese).toMatchObject({
      data: {
        code: "agent_required",
        title: "浏览器 SSH 需要 Agent",
        message: "请启用 Headplane Agent 后使用浏览器 SSH。",
        anchor: "#agent-required",
      },
    });
    for (const result of [english, fallback]) {
      expect(result).toMatchObject({
        data: {
          code: "agent_required",
          title: "Browser SSH needs the agent",
          message: "Turn on the Headplane agent to use browser SSH.",
          anchor: "#agent-required",
        },
      });
    }
    const changed = await app.call(saveLocale, "/api/locale", { form: { locale: "zh-CN" } });
    expect(statusOf(changed)).toBe(200);
    const response = changed as { init: ResponseInit };
    const preference = new Headers(response.init.headers).get("Set-Cookie")!.split(";")[0];
    // Saving a display preference neither authenticates a visitor nor enables SSH.
    expect(
      statusOf(
        await app.call(loader, "/ssh/server", {
          params: { id: "server" },
          headers: { Cookie: preference },
        }),
      ),
    ).toBe(400);
    await expect(
      app.ctx.auth.require(
        app.request("/ssh/server", {
          headers: { Cookie: preference },
        }),
      ),
    ).rejects.toThrow("Session cookie is empty");
  } finally {
    await app.dispose();
    app.ctx.db.$client.close();
  }
});
