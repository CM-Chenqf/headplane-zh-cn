const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHash } = require("node:crypto");
const { validateSnapshot } = require("./published-assets.cjs");
const { checkDestination } = require("./short-image-tag.cjs");

test("short tag migration accepts the original digest but refuses replacement and ambiguous registry errors", () => {
  const digest = `sha256:${"a".repeat(64)}`;
  assert.equal(checkDestination(200, {}, digest, digest), "exists");
  assert.equal(
    checkDestination(404, { errors: [{ code: "MANIFEST_UNKNOWN" }] }, null, digest),
    "create",
  );
  assert.throws(() => checkDestination(200, {}, `sha256:${"b".repeat(64)}`, digest));
  for (const status of [401, 403, 404, 429, 500])
    assert.throws(() => checkDestination(status, {}, null, digest));
});

test("public verification validates legacy snapshots and final-only snapshots without weakening checksum or source checks", () => {
  const tag = "v0.8.2-zh";
  const repository = "CM-Chenqf/headplane-zh-cn";
  const state = {
    schemaVersion: 2,
    repository,
    channel: "stable",
    publicationReady: true,
    upstream: { repository: "tale/headplane", version: "0.8.2", commit: "a".repeat(40) },
  };
  const release = { tag_name: tag, draft: false, prerelease: false, immutable: true };
  const sha = "b".repeat(40);
  const hash = (data) => createHash("sha256").update(data).digest("hex");
  for (const schemaVersion of [1, 2]) {
    const files = new Map(
      [
        "docs-root.tar.gz",
        "docs-archive.tar.gz",
        ...(schemaVersion === 1 ? ["source.tar.gz"] : []),
      ].map((name) => [name, Buffer.from(name)]),
    );
    const manifest = {
      schemaVersion,
      repository,
      tag,
      sourceCommit: sha,
      upstream: state.upstream,
      unofficial: true,
      assets: Object.fromEntries(
        [...files].map(([name, bytes]) => [name, { sha256: hash(bytes) }]),
      ),
      images: (schemaVersion === 1 ? ["final", "debug-shell"] : ["final"]).map((target) => ({
        target,
        reference: `ghcr.io/cm-chenqf/headplane-zh-cn:${schemaVersion === 1 ? tag + (target === "final" ? "" : "-shell") : "v0.8.2"}`,
        digest: `sha256:${"c".repeat(64)}`,
        platforms: ["linux/amd64", "linux/arm64"],
      })),
      ...(schemaVersion === 2
        ? {
            sourceArchives: {
              zip: `https://github.com/${repository}/archive/refs/tags/${tag}.zip`,
              tar: `https://github.com/${repository}/archive/refs/tags/${tag}.tar.gz`,
            },
          }
        : {}),
    };
    files.set("release-manifest.json", Buffer.from(JSON.stringify(manifest)));
    files.set(
      "SHA256SUMS",
      Buffer.from([...files].map(([name, data]) => `${hash(data)}  ${name}\n`).join("")),
    );
    assert.equal(
      validateSnapshot(release, files, state, sha, tag).pullReference,
      "ghcr.io/cm-chenqf/headplane-zh-cn:v0.8.2",
    );
    assert.throws(() => validateSnapshot(release, files, state, "d".repeat(40), tag));
    assert.throws(() => validateSnapshot({ ...release, immutable: false }, files, state, sha, tag));
    files.set("docs-root.tar.gz", Buffer.from("tampered"));
    assert.throws(() => validateSnapshot(release, files, state, sha, tag));
  }
});
