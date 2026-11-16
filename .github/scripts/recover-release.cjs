// Resume only verification/publication after the original images were uploaded.
// This tool never builds, pushes full image tags, moves Git tags or replaces assets.
const assert = require("node:assert/strict");
const { appendFileSync, readFileSync } = require("node:fs");
const {
  run,
  validateTag,
  metadata,
  publishedVersions,
  compareTags,
  parseTag,
} = require("./fork-release.cjs");

function validateOriginalRun(original, jobs, sha, tag, repository) {
  assert.equal(original.repository?.full_name, repository);
  assert.equal(original.event, "push");
  assert.equal(original.path, ".github/workflows/release.yaml");
  assert.equal(original.head_sha, sha, "The original build must use the unchanged tag source");
  assert.equal(original.head_branch, tag);
  assert.equal(original.status, "completed");
  assert.equal(original.conclusion, "failure");
  assert.equal(original.run_attempt, 1, "Inspect rerun artifacts separately before recovery");
  for (const name of [
    "Validate accepted stable source and archive docs",
    "Docker Release (final)",
  ]) {
    const job = jobs.find((item) => item.name === name);
    assert.equal(job?.conclusion, "success", `${name} must have completed successfully`);
    assert.equal(job?.head_sha, sha);
  }
  assert.equal(
    jobs.find((item) => item.name === "Publish immutable source, docs and image manifest")
      ?.conclusion,
    "skipped",
    "Only recover a release whose original publication job never ran",
  );
}

async function main() {
  const [runId, tag] = process.argv.slice(2);
  assert.match(runId ?? "", /^[1-9]\d*$/);
  parseTag(tag);
  const state = JSON.parse(readFileSync(".github/fork-release.json", "utf8"));
  validateTag(state, tag, JSON.parse(readFileSync("package.json", "utf8")).version);
  assert.equal(process.env.GITHUB_REPOSITORY, state.repository);
  const sha = run("git", ["rev-parse", "HEAD"]);
  assert.equal(run("git", ["rev-parse", `${tag}^{commit}`]), sha);
  assert.equal(run("git", ["status", "--porcelain"]), "", "Keep release source clean");
  const api = (path) => JSON.parse(run("gh", ["api", path]));
  const base = `repos/${state.repository}`;
  const original = api(`${base}/actions/runs/${runId}`);
  const jobs = JSON.parse(
    run("gh", ["api", "--paginate", "--slurp", `${base}/actions/runs/${runId}/jobs?per_page=100`]),
  ).flatMap((page) => page.jobs);
  validateOriginalRun(original, jobs, sha, tag, state.repository);
  const artifacts = api(`${base}/actions/runs/${runId}/artifacts?per_page=100`).artifacts;
  for (const name of ["release-input", "digest-final"])
    assert.equal(
      artifacts.filter((a) => a.name === name && !a.expired).length,
      1,
      `Require one unexpired original ${name} artifact`,
    );
  for (const workflow of ["build.yaml", "i18n-check.yaml", "docs.yaml"]) {
    const checks = api(
      `${base}/actions/workflows/${workflow}/runs?branch=stable&event=push&head_sha=${sha}&per_page=100`,
    ).workflow_runs;
    assert.equal(checks[0]?.head_sha, sha);
    assert.equal(
      checks[0]?.conclusion,
      "success",
      `Exact-source ${workflow} acceptance is required`,
    );
  }
  const upstream = api(`repos/${state.upstream.repository}/commits/v${state.upstream.version}`);
  assert.equal(upstream.sha, state.upstream.commit);
  run("git", ["merge-base", "--is-ancestor", state.upstream.commit, sha]);
  const releases = JSON.parse(
    run("gh", ["api", "--paginate", "--slurp", `${base}/releases?per_page=100`]),
  ).flat();
  assert.ok(
    !releases.some((r) => r.tag_name === tag),
    "Inspect existing release/draft; never replace it",
  );
  // Reading the repository setting requires administration permission, which
  // GITHUB_TOKEN cannot hold. Publication verifies release.immutable before
  // moving any alias; maintainers enable the setting before the original tag.
  const published = publishedVersions(releases);
  const meta = metadata(state);
  const minor = published.find((item) => parseTag(item).minor === meta.minor);
  const outputs = {
    ...meta,
    sha,
    latest: !published.length || compareTags(tag, published[0]) > 0,
    minor_latest: !minor || compareTags(tag, minor) > 0,
  };
  for (const [key, value] of Object.entries(outputs))
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  console.log(JSON.stringify({ originalRun: original.html_url, ...outputs }));
}

module.exports = { validateOriginalRun };
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
