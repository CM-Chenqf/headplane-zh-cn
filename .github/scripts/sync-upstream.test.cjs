const assert = require("node:assert/strict");
const { test } = require("node:test");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve, sep } = require("node:path");

const {
  watchedBranch,
  reviewCategory,
  syncBranchName,
  pullRequestBody,
  issueBody,
  hasCommit,
} = require("./sync-upstream.cjs");

test("tracks future release lines without copying upstream feature branches", () => {
  assert.equal(watchedBranch("main"), true);
  assert.equal(watchedBranch("release/0.8"), true);
  assert.equal(watchedBranch("release/12.30"), true);
  for (const branch of ["next", "feat/new-feature", "release/0.8/fix", "release/a.b"]) {
    assert.equal(watchedBranch(branch), false);
  }
});

test("keeps every upstream revision in a separate branch to preserve manual conflict resolutions", () => {
  const first = syncBranchName("release/0.8", "a".repeat(40));
  const second = syncBranchName("release/0.8", "b".repeat(40));
  assert.notEqual(first, second);
  assert.equal(first, "sync/upstream/release/0.8/aaaaaaaaaaaa");
  assert.throws(() => syncBranchName("--delete", "a".repeat(40)));
  assert.throws(() => syncBranchName("main", "invalid-sha"));
});

test("includes server errors and WASM prompts in translation review, not just React pages", () => {
  assert.equal(reviewCategory("app/server/web/actions.ts"), "界面与提示");
  assert.equal(reviewCategory("cmd/hp_ssh/wasm_js.go"), "界面与提示");
  assert.equal(reviewCategory("docs/install/docker.mdx"), "文档");
  assert.equal(reviewCategory("README.md"), "文档");
  assert.equal(reviewCategory(".github/workflows/build.yaml"), "构建、兼容性与其他功能");
});

test("large updates keep reminders below the GitHub body limit", () => {
  const paths = Array.from({ length: 1000 }, (_, i) => `app/routes/section-${i}/page.tsx`);
  const body = pullRequestBody("tale/headplane", "main", "a".repeat(40), paths);
  assert.ok(body.includes("另有 920 个文件"));
  assert.ok(body.includes("不发布镜像"));
  assert.ok(body.includes("pnpm i18n:check"));
  assert.ok(body.includes("pnpm i18n:review --message KEY"));
  assert.ok(body.length < 65536);
});

test("the tracking body is stable so repeated scheduled runs do not send duplicate notifications", () => {
  const pending = [{ branch: "main", sha: "a".repeat(40), message: "同步与汉化检查：#1" }];
  assert.equal(issueBody("tale/headplane", pending), issueBody("tale/headplane", pending));
  assert.notEqual(
    issueBody("tale/headplane", pending),
    issueBody("tale/headplane", [{ ...pending[0], sha: "b".repeat(40) }]),
  );
});

test("detects upstream commits across divergent fork history and reports broken history as an error", () => {
  const originalDirectory = process.cwd();
  const temporaryRoot = resolve(tmpdir());
  const directory = mkdtempSync(join(temporaryRoot, "headplane-sync-"));
  const resolvedDirectory = resolve(directory);
  if (!resolvedDirectory.startsWith(`${temporaryRoot}${sep}headplane-sync-`)) {
    throw new Error("Refusing to use a directory outside the temporary test root");
  }
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: directory,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();

  try {
    git("init", "--initial-branch=main", "--object-format=sha1");
    git("config", "user.name", "Sync Test");
    git("config", "user.email", "sync-test@example.invalid");
    git("config", "commit.gpgsign", "false");
    git("commit", "--allow-empty", "-m", "common history");
    const common = git("rev-parse", "HEAD");
    git("checkout", "-b", "upstream-main");
    git("commit", "--allow-empty", "-m", "upstream feature");
    const upstream = git("rev-parse", "HEAD");
    git("checkout", "main");
    git("commit", "--allow-empty", "-m", "fork translations");
    const fork = git("rev-parse", "HEAD");

    process.chdir(directory);
    assert.equal(hasCommit(fork, common), true);
    assert.equal(hasCommit(fork, upstream), false);
    git("merge", "--no-ff", "--no-edit", "upstream-main");
    assert.equal(hasCommit("HEAD", upstream), true);
    assert.throws(() => hasCommit("HEAD", "f".repeat(40)));
  } finally {
    process.chdir(originalDirectory);
    rmSync(resolvedDirectory, { recursive: true, force: true });
  }
});
