import { readdir } from "node:fs/promises";

import type { Config } from "@react-router/dev/config";

import { docsPath } from "./app/lib/i18n";

const ignoredDirs = ["app/", "build/", "public/", "node_modules/"];

export default {
  // Archived versions are built under their own path, such as `/0.8/`.
  basename: process.env.HEADPLANE_DOCS_BASE ?? "/",
  ssr: false,
  async prerender({ getStaticPaths }) {
    const paths = getStaticPaths();
    const entries = await readdir(import.meta.dirname, { recursive: true });

    for (const nativeEntry of entries) {
      const entry = nativeEntry.replaceAll("\\", "/");
      if (!/\.mdx?$/.test(entry) || ignoredDirs.some((dir) => entry.startsWith(dir))) {
        continue;
      }

      paths.push(docsPath(entry));
    }

    return [...new Set(paths)];
  },
} satisfies Config;
