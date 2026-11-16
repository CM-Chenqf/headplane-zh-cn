// Checks public release attachments independently of Actions authentication.
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { metadata, validateState, parseTag, run } = require("./fork-release.cjs");
const state = validateState(require("../fork-release.json"));
const meta = metadata(state);
const tag = process.env.RELEASE_TAG;
parseTag(tag);
assert.equal(tag, meta.tag);
const directory = resolve(process.argv[2]);
mkdirSync(directory, { recursive: true });
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Public download failed: ${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
async function main() {
  const release = JSON.parse(
    await download(`https://api.github.com/repos/${state.repository}/releases/tags/${tag}`),
  );
  assert.equal(release.draft, false);
  assert.equal(release.prerelease, false);
  assert.equal(release.immutable, true);
  const files = new Map();
  for (const name of [
    "source.tar.gz",
    "docs-root.tar.gz",
    "docs-archive.tar.gz",
    "release-manifest.json",
    "SHA256SUMS",
  ]) {
    const asset = release.assets.find((item) => item.name === name);
    assert.ok(asset, `Missing release asset ${name}`);
    const data = await download(asset.browser_download_url);
    files.set(name, data);
    writeFileSync(join(directory, name), data);
  }
  const checksums = files.get("SHA256SUMS").toString("utf8").trim().split("\n");
  assert.equal(checksums.length, 4);
  const checked = new Set();
  for (const line of checksums) {
    const match =
      /^([a-f0-9]{64})  (source\.tar\.gz|docs-root\.tar\.gz|docs-archive\.tar\.gz|release-manifest\.json)$/.exec(
        line,
      );
    assert.ok(match, "Invalid checksum line");
    assert.ok(!checked.has(match[2]), "Duplicate checksum entry");
    checked.add(match[2]);
    assert.equal(createHash("sha256").update(files.get(match[2])).digest("hex"), match[1]);
  }
  const manifest = JSON.parse(files.get("release-manifest.json"));
  assert.equal(manifest.tag, tag);
  assert.equal(manifest.sourceCommit, run("git", ["rev-parse", "HEAD"]));
  assert.deepEqual(manifest.upstream, state.upstream);
  assert.equal(manifest.unofficial, true);
  assert.equal(manifest.images.length, 2);
  for (const target of ["final", "debug-shell"]) {
    const image = manifest.images.find((item) => item.target === target);
    assert.equal(
      image?.reference,
      `${meta.image}:${meta.tag}${target === "final" ? "" : "-shell"}`,
    );
    assert.match(image.digest, /^sha256:[a-f0-9]{64}$/);
    assert.deepEqual(image.platforms, ["linux/amd64", "linux/arm64"]);
  }
  console.log(
    `Public immutable release ${tag}: source, bilingual docs, image identities and checksums verified.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
