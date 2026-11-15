import { defineI18n } from "fumadocs-core/i18n";
import { loader } from "fumadocs-core/source";
import { pageSchema } from "fumadocs-core/source/schema";
import { defineCollections, defineDocs } from "fumadocs-mdx/macro";

import { docsI18n } from "./i18n";

// Pages lead with their own `# Heading`, which doubles as the title when the
// frontmatter doesn't set one.
export const docs = defineDocs({
  dir: ".",
  docs: {
    files: ["**/*.{md,mdx}"],
    async: true,
    schema: ({ path, source }) =>
      pageSchema.extend({
        title: pageSchema.shape.title.default(/^# (.+)$/m.exec(source)?.[1] ?? path),
      }),
  },
  meta: {
    files: ["**/meta.json", "**/meta.zh-CN.json"],
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: "/",
  i18n: defineI18n({ ...docsI18n, languages: [...docsI18n.languages] }),
});

export const changelog = defineCollections({
  type: "doc",
  dir: "..",
  files: ["CHANGELOG.md", "CHANGELOG.zh-CN.md"],
});
