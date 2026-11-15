import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, test } from "vitest";

import { fingerprint } from "../../../scripts/i18n/core";
import { readDocumentSource } from "../../../scripts/i18n/documents";
import { tempDir } from "../../support/temp";

test("reviews the same changelog content with and without Windows symlink support", async () => {
  const root = await tempDir();
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "CHANGELOG.md"), "# Next\n\nTranslated feature.\n");
  await writeFile(join(root, "docs/CHANGELOG.md"), "./../CHANGELOG.md");
  const windowsHash = fingerprint(readDocumentSource(root, "docs/CHANGELOG.md"), "更新日志");
  await writeFile(join(root, "docs/CHANGELOG.md"), "# Next\n\nTranslated feature.\n");
  expect(fingerprint(readDocumentSource(root, "docs/CHANGELOG.md"), "更新日志")).toBe(windowsHash);

  await writeFile(join(root, "docs/CHANGELOG.md"), "./../CHANGELOG.md");
  await writeFile(join(root, "CHANGELOG.md"), "# Next\n\nChanged feature.\n");
  expect(fingerprint(readDocumentSource(root, "docs/CHANGELOG.md"), "更新日志")).not.toBe(
    windowsHash,
  );
});

test("does not reinterpret path-like prose in unrelated documents", async () => {
  const root = await tempDir();
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs/example.md"), "./../CHANGELOG.md");
  expect(readDocumentSource(root, "docs/example.md")).toBe("./../CHANGELOG.md");
});
