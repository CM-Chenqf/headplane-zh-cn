import { describe, expect, test } from "vitest";

import { docsPath, docsRoute, localizedPath } from "../../../docs/app/lib/i18n";

describe("documentation language links", () => {
  test("switches a nested page without losing query parameters or release anchors", () => {
    const original = "/changelog?from=upgrade#v0.8.1";
    const chinese = localizedPath(original, "zh-CN");
    expect(chinese).toBe("/zh-CN/changelog?from=upgrade#v0.8.1");
    expect(localizedPath(chinese, "en")).toBe(original);
    expect(localizedPath(chinese, "zh-CN")).toBe(chinese);
  });

  test("only treats the exact leading language segment as a locale", () => {
    expect(docsRoute("/zh-CN/configuration/tls")).toEqual({
      locale: "zh-CN",
      path: "/configuration/tls",
    });
    expect(docsRoute("/zh-CN")).toEqual({ locale: "zh-CN", path: "/" });
    expect(docsRoute("/zh-CN-extra")).toEqual({ locale: "en", path: "/zh-CN-extra" });
    expect(docsRoute("/features/zh-CN")).toEqual({ locale: "en", path: "/features/zh-CN" });
  });

  test("keeps external links, fragments, relative resources and downloads intact", () => {
    for (const href of [
      "https://headscale.net/docs",
      "//example.com/docs",
      "mailto:admin@example.com",
      "#requirements",
      "../assets/diagram.png",
      "/assets/diagram.svg",
      "/config.yaml?download=1#example",
    ]) {
      expect(localizedPath(href, "zh-CN")).toBe(href);
    }
    expect(localizedPath("/install/docker#requirements", "zh-CN")).toBe(
      "/zh-CN/install/docker#requirements",
    );
  });

  test("leaves the archive prefix to the router so a locale round trip does not duplicate it", () => {
    const base = "/0.8/";
    const appPath = "/features/ssh?example=1#requirements";
    const archived = new URL(
      base.slice(0, -1) + localizedPath(appPath, "zh-CN"),
      "https://docs.example.com",
    );
    expect(archived.pathname).toBe("/0.8/zh-CN/features/ssh");
    expect(archived.search).toBe("?example=1");
    expect(archived.hash).toBe("#requirements");
    expect(localizedPath(archived.pathname.slice(base.length - 1), "en")).toBe("/features/ssh");
  });
});

test("prerender paths remove file extensions and language suffixes, including Windows index paths", () => {
  expect(docsPath("configuration\\index.zh-CN.md")).toBe("/zh-CN/configuration");
  expect(docsPath("install\\docker.zh-CN.mdx")).toBe("/zh-CN/install/docker");
  expect(docsPath("install/index.mdx")).toBe("/install");
  expect(docsPath("index.zh-CN.mdx")).toBe("/zh-CN");
});
