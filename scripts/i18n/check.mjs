import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  catalogProblems,
  fingerprint,
  freshnessProblems,
  literalFindings,
  literalProblems,
  reviewSelected,
} from "./core.ts";
import { readDocumentSource } from "./documents.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const scope = JSON.parse(read(".github/i18n/scope.json"));
const exceptions = JSON.parse(read(".github/i18n/exceptions.json"));
const manifest = resolve(root, ".github/i18n/reviewed.json");

async function catalogs() {
  const directory = pathToFileURL(resolve(root, "app/i18n") + "/").href;
  const hook = registerHooks({
    resolve(specifier, context, next) {
      if (
        context.parentURL?.startsWith(directory) &&
        specifier.startsWith(".") &&
        !/\.[a-z]+$/i.test(specifier)
      )
        specifier += ".ts";
      return next(specifier, context);
    },
  });
  try {
    return (await import(pathToFileURL(resolve(root, "app/i18n/messages.ts")).href)).messages;
  } finally {
    hook.deregister();
  }
}

function checkLiterals() {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, "node_modules/oxlint/bin/oxlint"),
      "--config",
      "scripts/i18n/oxlint.json",
      "--format",
      "json",
      ...scope.uiFiles,
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (![0, 1].includes(result.status))
    throw new Error(`Localization lint could not run: ${result.stderr || result.stdout}`);
  const diagnostics = JSON.parse(result.stdout).diagnostics;
  if (!Array.isArray(diagnostics) || (result.status !== 0 && !diagnostics.length))
    throw new Error("Localization lint returned an invalid result");
  const unexpected = diagnostics.filter(
    (entry) => !["react(jsx-no-literals)", "headplane-i18n(no-raw-messages)"].includes(entry.code),
  );
  if (unexpected.length) throw new Error(JSON.stringify(unexpected));
  return literalProblems(literalFindings(diagnostics, read), exceptions.literals);
}

function writeReview(value) {
  for (const kind of ["messages", "documents", "shared"])
    value[kind] = Object.fromEntries(
      Object.entries(value[kind]).sort(([a], [b]) => a.localeCompare(b, "en")),
    );
  writeFileSync(manifest, JSON.stringify(value, null, 2) + "\n");
}

async function main() {
  const [command = "check", ...args] = process.argv.slice(2);
  if (!["check", "review", "release"].includes(command))
    throw new Error("Use check, review or release");
  const selected = { messages: [], files: [] };
  let initialize = false;
  for (let i = 0; i < args.length; i++) {
    if (command === "review" && args[i] === "--initialize") initialize = true;
    else if (
      command === "review" &&
      ["--message", "--file"].includes(args[i]) &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    ) {
      const kind = args[i] === "--message" ? "messages" : "files";
      selected[kind].push(args[++i].replaceAll("\\", "/"));
    } else throw new Error(`Unexpected argument: ${args[i]}`);
  }
  if (
    scope.version !== 1 ||
    scope.line !==
      JSON.parse(read(".github/fork-release.json"))
        .upstream.version.split(".")
        .slice(0, 2)
        .join(".") ||
    !scope.uiFiles.length ||
    !scope.documents.length
  )
    throw new Error("Invalid release-line translation scope");
  if (command === "release" && (!scope.complete || scope.pending.length))
    throw new Error(
      `Release blocked: stable localization and acceptance are incomplete: ${scope.pending.join(", ")}`,
    );
  const catalog = await catalogs();
  const problems = catalogProblems(catalog.en, catalog["zh-CN"], exceptions.messages);
  const current = { version: 1, messages: {}, documents: {}, shared: {} };
  for (const [key, english] of Object.entries(catalog.en))
    current.messages[key] = fingerprint(english, catalog["zh-CN"][key] ?? "");
  for (const pair of scope.documents) {
    if (!existsSync(resolve(root, pair.english)) || !existsSync(resolve(root, pair.chinese)))
      problems.push(`${pair.english}: missing English or Chinese document`);
    else {
      const chinese = readDocumentSource(root, pair.chinese);
      if (!/\p{Script=Han}/u.test(chinese)) problems.push(`${pair.chinese}: untranslated document`);
      current.documents[pair.english] = fingerprint(
        readDocumentSource(root, pair.english),
        chinese,
      );
    }
  }
  for (const file of scope.uiFiles) current.shared[file] = fingerprint(read(file));
  current.shared[".github/i18n/scope.json"] = fingerprint(read(".github/i18n/scope.json"));
  if (command !== "review" || initialize) problems.push(...checkLiterals());
  if (command !== "review") {
    if (!existsSync(manifest)) problems.push("Missing initial translation review");
    else problems.push(...freshnessProblems(current, JSON.parse(readFileSync(manifest, "utf8"))));
  }
  if (problems.length) throw new Error(problems.join("\n"));
  if (command === "review") {
    if (initialize) {
      if (existsSync(manifest))
        throw new Error("Review baseline already exists; select individual entries");
      if (selected.messages.length || selected.files.length)
        throw new Error("Do not combine initialization with selected entries");
      writeReview(current);
    } else
      writeReview(reviewSelected(current, JSON.parse(readFileSync(manifest, "utf8")), selected));
    console.log("Saved selected review records; run pnpm i18n:check.");
  } else {
    console.log(
      `Scoped translation check passed: ${Object.keys(current.messages).length} messages, ${scope.uiFiles.length} UI sources, ${scope.documents.length} document pairs.`,
    );
    if (!scope.complete)
      console.log(
        `Stable publication acceptance is INCOMPLETE. Pending: ${scope.pending.join(", ")}. This check does not approve publication.`,
      );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
