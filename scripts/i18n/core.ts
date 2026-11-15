import { createHash } from "node:crypto";

type ReviewKind = "messages" | "documents" | "shared";
export type ReviewManifest = { version: number } & Record<ReviewKind, Record<string, string>>;
export type LiteralFinding = { file: string; text: string; line?: number };
type LiteralException = LiteralFinding & { reason: string };
type Diagnostic = {
  code: string;
  filename: string;
  labels?: { span?: { offset: number; length: number; line?: number } }[];
};

export function fingerprint(...texts: string[]) {
  return createHash("sha256")
    .update(JSON.stringify(texts.map((text) => text.replaceAll("\r\n", "\n"))))
    .digest("hex");
}

export function catalogProblems(
  english: Record<string, string>,
  chinese: Record<string, string>,
  exceptions: { key: string; reason: string }[] = [],
) {
  const problems = [];
  const allowed = new Set(exceptions.map((entry) => entry.key));
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const key of Object.keys(english).sort()) {
    const source = english[key];
    const target = chinese[key];
    if (typeof source !== "string" || !source.trim()) {
      problems.push(`messages:${key}: empty or invalid English message`);
    } else if (typeof target !== "string" || !target.trim()) {
      problems.push(`messages:${key}: missing or empty Chinese translation`);
    } else {
      if (JSON.stringify(placeholders(source)) !== JSON.stringify(placeholders(target))) {
        problems.push(`messages:${key}: interpolation placeholders differ`);
      }
      if (!/\p{Script=Han}/u.test(target) && !allowed.has(key)) {
        problems.push(
          `messages:${key}: Chinese text needs translation or a justified technical-name exception`,
        );
      }
    }
  }
  for (const key of Object.keys(chinese).sort()) {
    if (!Object.hasOwn(english, key))
      problems.push(`messages:${key}: Chinese key has no English source`);
  }
  for (const entry of exceptions) {
    if (
      !entry.reason?.trim() ||
      !Object.hasOwn(english, entry.key) ||
      /\p{Script=Han}/u.test(chinese[entry.key] ?? "")
    ) {
      problems.push(`messages:${entry.key}: unused or unjustified exception`);
    }
  }
  if (allowed.size !== exceptions.length)
    problems.push("exceptions.json: duplicate message exceptions");
  return problems;
}

export function freshnessProblems(current: ReviewManifest, reviewed: ReviewManifest) {
  const problems = [];
  if (reviewed.version !== 1) return ["reviewed.json: unsupported review format"];
  for (const kind of ["messages", "documents", "shared"] as const) {
    const previous = reviewed[kind] ?? {};
    for (const [name, hash] of Object.entries(current[kind]).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (!Object.hasOwn(previous, name))
        problems.push(`${kind}:${name}: new translation requires review`);
      else if (previous[name] !== hash)
        problems.push(`${kind}:${name}: changed since the last translation review`);
    }
    for (const name of Object.keys(previous).sort()) {
      if (!Object.hasOwn(current[kind], name))
        problems.push(`${kind}:${name}: removed source; remove its review record`);
    }
  }
  return problems;
}

export function reviewSelected(
  current: ReviewManifest,
  reviewed: ReviewManifest,
  { messages = [], files = [] }: { messages?: string[]; files?: string[] },
) {
  const next = structuredClone(reviewed);
  if (next.version !== 1) throw new Error("Unsupported review format");
  if (!messages.length && !files.length)
    throw new Error("Select --message KEY or --file PATH after reviewing its translation");
  const selections: [ReviewKind, string[]][] = [
    ["messages", messages],
    [
      "documents",
      files.filter((f) => Object.hasOwn(current.documents, f) || Object.hasOwn(next.documents, f)),
    ],
    [
      "shared",
      files.filter((f) => Object.hasOwn(current.shared, f) || Object.hasOwn(next.shared, f)),
    ],
  ];
  for (const [kind, names] of selections) {
    for (const name of names) {
      if (!Object.hasOwn(current[kind], name) && !Object.hasOwn(next[kind], name))
        throw new Error(`Unknown ${kind} entry: ${name}`);
      if (Object.hasOwn(current[kind], name)) next[kind][name] = current[kind][name];
      else delete next[kind][name];
    }
  }
  for (const file of files) {
    if (
      !(["documents", "shared"] as const).some(
        (kind) => Object.hasOwn(current[kind], file) || Object.hasOwn(reviewed[kind], file),
      )
    )
      throw new Error(`Unknown file: ${file}`);
  }
  return next;
}

const visibleAttributes = new Set([
  "title",
  "label",
  "aria-label",
  "alt",
  "placeholder",
  "description",
  "content",
  "text",
  "emptyText",
]);

export function literalFindings(
  diagnostics: Diagnostic[],
  readSource: (file: string) => string,
): LiteralFinding[] {
  const findings: LiteralFinding[] = [];
  for (const diagnostic of diagnostics) {
    if (
      diagnostic.code !== "react(jsx-no-literals)" &&
      diagnostic.code !== "headplane-i18n(no-raw-messages)"
    )
      continue;
    const span = diagnostic.labels?.[0]?.span;
    if (!span) throw new Error("Unexpected localization lint diagnostic without a source span");
    const file = diagnostic.filename.replaceAll("\\", "/");
    const text = Buffer.from(readSource(file))
      .subarray(span.offset, span.offset + span.length)
      .toString("utf8")
      .trim();
    if (diagnostic.code === "react(jsx-no-literals)") {
      const attribute = /^([\w-]+)=/.exec(text);
      if (attribute && !visibleAttributes.has(attribute[1])) continue;
      if (!/\p{L}/u.test(attribute ? text.slice(attribute[0].length) : text)) continue;
      // Character entities and punctuation are not natural-language messages.
      if (/^(?:&(?:#\d+|#x[\da-f]+|[a-z]+);|\s|[\p{P}\p{S}])+$/iu.test(text)) continue;
    }
    findings.push({ file, text, line: span.line });
  }
  return findings;
}

export function literalProblems(findings: LiteralFinding[], exceptions: LiteralException[]) {
  const identity = (entry: LiteralFinding) => JSON.stringify([entry.file, entry.text]);
  const allowed = new Map(exceptions.map((entry) => [identity(entry), entry]));
  const seen = new Set(findings.map(identity));
  const problems = findings
    .filter((entry) => !allowed.has(identity(entry)))
    .map(
      (entry) => `${entry.file}:${entry.line}: untranslated literal ${JSON.stringify(entry.text)}`,
    );
  for (const entry of exceptions) {
    if (!entry.reason?.trim() || !seen.has(identity(entry)))
      problems.push(
        `${entry.file}: unused or unjustified literal exception ${JSON.stringify(entry.text)}`,
      );
  }
  if (allowed.size !== exceptions.length)
    problems.push("exceptions.json: duplicate literal exceptions");
  return problems;
}
