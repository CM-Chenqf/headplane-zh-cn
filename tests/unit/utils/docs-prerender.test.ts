import { expect, test } from "vitest";

import docsConfig from "../../../docs/react-router.config";

test("nested docs prerender with URL separators and exclude internal directories on Windows", async () => {
  const paths = await docsConfig.prerender({ getStaticPaths: () => ["/"] });

  expect(paths).toContain("/reference/nixos-options");
  expect(paths.some((path) => path.includes("\\") || path.includes("%5C"))).toBe(false);
  expect(paths.some((path) => /^\/(app|build|public|node_modules)\//.test(path))).toBe(false);
});
