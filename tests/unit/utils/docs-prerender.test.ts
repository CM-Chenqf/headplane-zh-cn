import { expect, test } from "vitest";

import docsConfig from "../../../docs/react-router.config";

test("nested docs prerender with URL separators and exclude internal directories on Windows", async () => {
  const paths = await docsConfig.prerender({ getStaticPaths: () => ["/"] });

  expect(paths).toContain("/reference/nixos-options");
  expect(paths).toContain("/zh-CN/reference/nixos-options");
  expect(paths).toContain("/zh-CN/install");
  expect(paths.some((path) => path.includes(".zh-CN"))).toBe(false);
  expect(new Set(paths).size).toBe(paths.length);
  expect(paths.some((path) => path.includes("\\") || path.includes("%5C"))).toBe(false);
  expect(paths.some((path) => /^\/(app|build|public|node_modules)\//.test(path))).toBe(false);
});
