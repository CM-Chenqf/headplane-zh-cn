import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  catalogProblems,
  discoverSources,
  fingerprint,
  freshnessProblems,
  literalFindings,
  literalProblems,
  reviewSelected,
} from "./core.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const manifest = resolve(root, ".github/i18n/reviewed.json");
const exceptions = JSON.parse(read(".github/i18n/exceptions.json"));

async function catalogs() {
  const directory = pathToFileURL(resolve(root, "app/i18n") + "/").href;
  const hook = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (
        context.parentURL?.startsWith(directory) &&
        specifier.startsWith(".") &&
        !/\.[a-z]+$/i.test(specifier)
      )
        specifier += ".ts";
      return nextResolve(specifier, context);
    },
  });
  try {
    const { messages } = await import(pathToFileURL(resolve(root, "app/i18n/messages.ts")).href);
    return messages;
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
      "app",
      "docs/app",
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (![0, 1].includes(result.status))
    throw new Error(`Localization lint could not run: ${result.stderr || result.stdout}`);
  const diagnostics = JSON.parse(result.stdout).diagnostics;
  if (!Array.isArray(diagnostics))
    throw new Error("Localization lint returned no diagnostics array");
  const unexpected = diagnostics.filter(
    (entry) => !["react(jsx-no-literals)", "headplane-i18n(no-raw-messages)"].includes(entry.code),
  );
  if (unexpected.length) throw new Error(`Localization lint errors: ${JSON.stringify(unexpected)}`);
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
  if (!["check", "review"].includes(command))
    throw new Error("Use check or review --message KEY / --file ENGLISH_PATH");
  const selected = { messages: [], files: [] };
  let initialize = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (command === "review" && arg === "--initialize") initialize = true;
    else if (
      command === "review" &&
      ["--message", "--file"].includes(arg) &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    )
      selected[arg === "--message" ? "messages" : "files"].push(args[++i].replaceAll("\\", "/"));
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  const catalog = await catalogs();
  const files = discoverSources(root);
  const current = {
    version: 1,
    messages: Object.fromEntries(
      Object.keys(catalog.en).map((key) => [
        key,
        fingerprint(catalog.en[key], catalog["zh-CN"][key] ?? ""),
      ]),
    ),
    documents: files.documents,
    shared: files.shared,
  };
  const problems = [
    ...catalogProblems(catalog.en, catalog["zh-CN"], exceptions.messages),
    ...files.problems,
  ];
  if (command === "check") {
    problems.push(...checkLiterals());
    if (existsSync(manifest))
      problems.push(...freshnessProblems(current, JSON.parse(readFileSync(manifest, "utf8"))));
    else problems.push("reviewed.json: missing initial translation review");
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error(
      `\n${problems.length} localization problem(s). Review the source and Chinese translation; checks never update review records.`,
    );
    process.exitCode = 1;
    return;
  }
  if (command === "review") {
    if (initialize) {
      if (existsSync(manifest))
        throw new Error(
          "Review baseline already exists; select individual --message or --file entries",
        );
      if (selected.messages.length || selected.files.length)
        throw new Error("Do not combine --initialize with selected entries");
      const literalErrors = checkLiterals();
      if (literalErrors.length) throw new Error(literalErrors.join("\n"));
      writeReview(current);
    } else {
      writeReview(reviewSelected(current, JSON.parse(readFileSync(manifest, "utf8")), selected));
    }
    console.log(
      "Saved the selected translation review records. Run pnpm i18n:check before committing.",
    );
  } else
    console.log(
      `Localization check passed: ${Object.keys(current.messages).length} messages, ${Object.keys(current.documents).length} document pairs, ${Object.keys(current.shared).length} shared documentation sources.`,
    );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
