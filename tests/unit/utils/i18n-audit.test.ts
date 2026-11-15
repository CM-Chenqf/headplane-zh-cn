import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { expect, test } from "vitest";

import {
  catalogProblems,
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
  shared: { "app/header.tsx": fingerprint("menu") },
});

test("English-only edits to a message or document require a new review", () => {
  const reviewed = snapshot();
  const current = snapshot();
  current.messages.greeting = fingerprint("Welcome {name}", "你好，{name}");
  current.documents["docs/install.md"] = fingerprint("Install with TLS", "安装");
  expect(freshnessProblems(current, reviewed)).toEqual([
    "messages:greeting: changed since the last translation review",
    "documents:docs/install.md: changed since the last translation review",
  ]);
  expect(reviewed).toEqual(snapshot());
  expect(fingerprint("one\r\ntwo", "中文\r\n")).toBe(fingerprint("one\ntwo", "中文\n"));
});

test("reviewing one entry leaves unrelated stale sources blocked", () => {
  const reviewed = snapshot();
  const current = snapshot();
  current.messages.greeting = fingerprint("Welcome", "欢迎");
  current.shared["app/header.tsx"] = fingerprint("new navigation");
  const next = reviewSelected(current, reviewed, { messages: ["greeting"] });
  expect(freshnessProblems(current, next)).toEqual([
    "shared:app/header.tsx: changed since the last translation review",
  ]);
  expect(reviewed).toEqual(snapshot());
  expect(() => reviewSelected(current, reviewed, {})).toThrow("Select");
  expect(() => reviewSelected(current, reviewed, { files: ["../outside.md"] })).toThrow(
    "Unknown file",
  );
});

test("missing translations, mismatched placeholders and orphaned keys cannot pass", () => {
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
});

test("technical exceptions match the exact UTF-8 source span and reject stale exceptions", () => {
  const source = '<p>中文</p><button title="Save">Save</button>';
  const findings = literalFindings(
    [
      {
        code: "react(jsx-no-literals)",
        filename: "app\\button.tsx",
        labels: [
          { span: { offset: Buffer.byteLength("<p>中文</p><button "), length: 12, line: 1 } },
        ],
      },
    ],
    () => source,
  );
  expect(findings).toEqual([{ file: "app/button.tsx", line: 1, text: 'title="Save"' }]);
  expect(
    literalProblems(findings, [
      { file: "app/other.tsx", text: 'title="Save"', reason: "Wrong file" },
    ]),
  ).toHaveLength(2);
  expect(
    literalProblems(findings, [
      { file: "app/button.tsx", text: 'title="Save"', reason: "Reviewed example" },
    ]),
  ).toEqual([]);
});

test("real syntax scanning catches accessible labels, indirect messages and action errors", async () => {
  const file = join(await tempDir(), "messages.tsx");
  await writeFile(
    file,
    `const jsx = <button aria-label="Dismiss">Save</button>;
    const label = { title: "New upstream feature" };
    const translated = <button aria-label={t("common.close")}>{t("common.save")}</button>;
    toast("Saved successfully");
    throw new ActionError(\`Could not update \${name}\`);`,
  );
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
