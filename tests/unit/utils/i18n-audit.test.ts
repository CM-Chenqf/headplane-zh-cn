import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { describe, expect, test } from "vitest";

import {
  catalogProblems,
  discoverSources,
  fingerprint,
  freshnessProblems,
  literalFindings,
  literalProblems,
  reviewSelected,
} from "../../../scripts/i18n/core";
import { tempDir } from "../../support/temp";

const snapshot = () => ({
  version: 1,
  messages: { greeting: fingerprint("Hello {name}", "你好，{name}") },
  documents: { "docs/install.md": fingerprint("Install", "安装") },
  shared: { "docs/app/menu.tsx": fingerprint("menu") },
});

describe("translation review", () => {
  test("detects English-only message and document edits even when Chinese files still exist", () => {
    const reviewed = snapshot();
    const current = snapshot();
    current.messages.greeting = fingerprint("Welcome {name}", "你好，{name}");
    current.documents["docs/install.md"] = fingerprint("Install with TLS", "安装");
    expect(freshnessProblems(current, reviewed)).toEqual([
      "messages:greeting: changed since the last translation review",
      "documents:docs/install.md: changed since the last translation review",
    ]);
    expect(reviewed).toEqual(snapshot());
  });

  test("normalizes Windows newlines without hiding real configuration or prose changes", () => {
    expect(fingerprint("first\r\nsecond\r\n", "中文\r\n")).toBe(
      fingerprint("first\nsecond\n", "中文\n"),
    );
    expect(fingerprint("port: 3000", "安装")).not.toBe(fingerprint("port: 3001", "安装"));
  });

  test("requires deliberate selection and never approves unrelated stale entries", () => {
    const reviewed = snapshot();
    const current = snapshot();
    current.messages.greeting = fingerprint("Welcome", "欢迎");
    current.documents["docs/install.md"] = fingerprint("New", "新");
    const next = reviewSelected(current, reviewed, { messages: ["greeting"] });
    expect(freshnessProblems(current, next)).toEqual([
      "documents:docs/install.md: changed since the last translation review",
    ]);
    expect(reviewed).toEqual(snapshot());
    expect(() => reviewSelected(current, reviewed, {})).toThrow("Select");
    expect(() => reviewSelected(current, reviewed, { files: ["../outside.md"] })).toThrow(
      "Unknown file",
    );
  });

  test("reports removed pages and shared UI changes and lets reviewers remove obsolete records", () => {
    const reviewed = snapshot();
    const current = snapshot();
    delete (current.documents as Record<string, string>)["docs/install.md"];
    current.shared["docs/app/menu.tsx"] = fingerprint("new menu");
    expect(freshnessProblems(current, reviewed)).toEqual([
      "documents:docs/install.md: removed source; remove its review record",
      "shared:docs/app/menu.tsx: changed since the last translation review",
    ]);
    expect(
      freshnessProblems(
        current,
        reviewSelected(current, reviewed, { files: ["docs/install.md", "docs/app/menu.tsx"] }),
      ),
    ).toEqual([]);
  });
});

test("rejects empty, missing, orphaned and untranslated messages and mismatched interpolation counts", () => {
  expect(
    catalogProblems(
      { a: "Hello {name}", b: "Save", c: "DNS", d: "{x} {x}" },
      { a: "你好", b: " ", c: "DNS", d: "值 {x}", extra: "多余" },
      [{ key: "c", reason: "DNS protocol name" }],
    ),
  ).toEqual([
    "messages:a: interpolation placeholders differ",
    "messages:b: missing or empty Chinese translation",
    "messages:d: interpolation placeholders differ",
    "messages:extra: Chinese key has no English source",
  ]);
  expect(catalogProblems({ a: "Save" }, { a: "Save" })).toHaveLength(1);
  expect(catalogProblems({ a: "Save" }, { a: "保存" }, [{ key: "a", reason: "" }])).toContain(
    "messages:a: unused or unjustified exception",
  );
});

test("reads UTF-8 lint spans accurately and limits exceptions to the exact file and text", () => {
  const text = '<p>中文</p><button title="Save">Save</button>';
  const offset = Buffer.byteLength("<p>中文</p><button ");
  const findings = literalFindings(
    [
      {
        code: "react(jsx-no-literals)",
        filename: "app\\button.tsx",
        labels: [{ span: { offset, length: 12, line: 1 } }],
      },
    ],
    () => text,
  );
  expect(findings).toEqual([{ file: "app/button.tsx", line: 1, text: 'title="Save"' }]);
  expect(
    literalProblems(findings, [
      { file: "app/other.tsx", text: 'title="Save"', reason: "A different control" },
    ]),
  ).toHaveLength(2);
  expect(
    literalProblems(findings, [
      { file: "app/button.tsx", text: 'title="Save"', reason: "Reviewed example" },
    ]),
  ).toEqual([]);
});

test("finds new and orphaned documentation and rejects navigation or release-structure drift", async () => {
  const root = await tempDir();
  await mkdir(join(root, "docs"));
  for (const name of ["README", "CHANGELOG"]) {
    await writeFile(join(root, `${name}.md`), "# Next\n\n## Changes\n\nEnglish");
    await writeFile(join(root, `${name}.zh-CN.md`), "# Next\n\n## Changes\n\n中文");
  }
  const baseline = discoverSources(root);
  expect(baseline.problems).toEqual([]);
  await writeFile(join(root, "docs/new.mdx"), "# New feature");
  await writeFile(join(root, "docs/orphan.zh-CN.md"), "# 已删除英文源文");
  await writeFile(join(root, "docs/meta.json"), JSON.stringify({ pages: ["new", "install"] }));
  await writeFile(
    join(root, "docs/meta.zh-CN.json"),
    JSON.stringify({ pages: ["install", "new"] }),
  );
  await writeFile(join(root, "CHANGELOG.zh-CN.md"), "# Next\n\n## 修改\n\n中文");
  expect(discoverSources(root).problems).toEqual([
    "CHANGELOG.zh-CN.md: release versions or section markers differ from English",
    "docs/meta.zh-CN.json: navigation order or page references differ from English",
    "docs/new.mdx: missing English source or Chinese document docs/new.zh-CN.mdx",
    "docs/orphan.zh-CN.md: Chinese document has no English source",
  ]);
});

test("real syntax scanning catches accessible labels, indirect UI messages and action errors", async () => {
  const file = join(await tempDir(), "messages.tsx");
  const source = `
    const jsx = <button aria-label="Dismiss">Save</button>;
    const label = { title: "New upstream feature" };
    const translated = <button aria-label={t("common.close")}>{t("common.save")}</button>;
    toast("Saved successfully");
    throw new ActionError(\`Could not update \${name}\`);
  `;
  await writeFile(file, source);
  const result = spawnSync(
    process.execPath,
    [
      resolve("node_modules/oxlint/bin/oxlint"),
      "--config",
      resolve("scripts/i18n/oxlint.json"),
      "--format",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(1);
  const contents = await readFile(file, "utf8");
  const found = literalFindings(JSON.parse(result.stdout).diagnostics, () => contents);
  expect(found.map((entry) => entry.text).sort()).toEqual(
    [
      '"New upstream feature"',
      '"Saved successfully"',
      "Save",
      "`Could not update ${name}`",
      'aria-label="Dismiss"',
    ].sort(),
  );
});
