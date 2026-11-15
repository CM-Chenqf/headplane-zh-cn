import { readFileSync } from "node:fs";

const scope = JSON.parse(
  readFileSync(new URL("../../.github/i18n/scope.json", import.meta.url), "utf8"),
);
if (
  scope.version !== 1 ||
  scope.line !== "0.8" ||
  scope.complete !== true ||
  !Array.isArray(scope.pending) ||
  scope.pending.length
) {
  console.error(
    "Release blocked: release/0.8 localization and publication acceptance are incomplete. See .github/I18N_PROGRESS.zh-CN.md.",
  );
  process.exitCode = 1;
}
