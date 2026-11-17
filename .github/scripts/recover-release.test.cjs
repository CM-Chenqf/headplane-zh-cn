const assert = require("node:assert/strict");
const { test } = require("node:test");
const { validateOriginalRun } = require("./recover-release.cjs");

test("recovery rejects unrelated sources, incomplete image uploads and already attempted publication", () => {
  const sha = "a".repeat(40);
  const tag = "v0.8.2-zh";
  const repository = "laity-cqf/headplane-zh-cn";
  const original = {
    repository: { full_name: repository },
    event: "push",
    path: ".github/workflows/release.yaml",
    head_sha: sha,
    head_branch: tag,
    status: "completed",
    conclusion: "failure",
    run_attempt: 1,
  };
  const jobs = [
    "Validate accepted stable source and archive docs",
    "Docker Release (final)",
    "Publish immutable source, docs and image manifest",
  ].map((name, index) => ({
    name,
    head_sha: sha,
    conclusion: index === 2 ? "skipped" : "success",
  }));
  validateOriginalRun(original, jobs, sha, tag, repository);
  for (const change of [
    { head_sha: "b".repeat(40) },
    { head_branch: "stable" },
    { event: "pull_request" },
    { path: ".github/workflows/containers.yaml" },
    { repository: { full_name: "other/fork" } },
    { status: "in_progress" },
    { run_attempt: 2 },
  ])
    assert.throws(() =>
      validateOriginalRun({ ...original, ...change }, jobs, sha, tag, repository),
    );
  for (const index of [0, 1, 2]) {
    const changed = jobs.map((job, i) => ({
      ...job,
      ...(i === index ? { conclusion: "failure" } : {}),
    }));
    assert.throws(() => validateOriginalRun(original, changed, sha, tag, repository));
  }
});
