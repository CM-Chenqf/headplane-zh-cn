// Add a short image tag without rebuilding or changing the original index bytes.
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { metadata, validateState, imageMissing } = require("./fork-release.cjs");

function checkDestination(status, body, digest, expected) {
  if (status === 200) {
    assert.equal(digest, expected, "Short image tag already points elsewhere; never overwrite it");
    return "exists";
  }
  assert.ok(imageMissing(status, body), `Cannot confirm unused short tag (${status})`);
  return "create";
}

async function main() {
  const state = validateState(JSON.parse(readFileSync(".github/fork-release.json", "utf8")));
  const meta = metadata(state);
  const manifest = JSON.parse(readFileSync(process.argv[2], "utf8"));
  assert.equal(manifest.tag, meta.tag);
  assert.equal(manifest.repository, state.repository);
  const final = manifest.images.find((image) => image.target === "final");
  assert.match(final.digest, /^sha256:[a-f0-9]{64}$/);
  assert.ok(process.env.GH_TOKEN && process.env.GITHUB_ACTOR);
  const path = meta.image.replace(/^ghcr\.io\//, "");
  const authorization = Buffer.from(`${process.env.GITHUB_ACTOR}:${process.env.GH_TOKEN}`).toString(
    "base64",
  );
  const tokenResponse = await fetch(
    `https://ghcr.io/token?service=ghcr.io&scope=${encodeURIComponent(`repository:${path}:pull,push`)}`,
    {
      headers: { Authorization: `Basic ${authorization}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  assert.ok(tokenResponse.ok, `Registry authorization failed: ${tokenResponse.status}`);
  const { token } = await tokenResponse.json();
  assert.ok(token);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:
      "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json",
  };
  const endpoint = `https://ghcr.io/v2/${path}/manifests/`;
  const original = await fetch(endpoint + final.digest, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  assert.ok(original.ok, `Cannot read original index: ${original.status}`);
  const bytes = Buffer.from(await original.arrayBuffer());
  assert.equal(`sha256:${createHash("sha256").update(bytes).digest("hex")}`, final.digest);
  const index = JSON.parse(bytes);
  for (const arch of ["amd64", "arm64"])
    assert.ok(
      index.manifests.some(
        (item) => item.platform?.os === "linux" && item.platform.architecture === arch,
      ),
    );
  const existing = await fetch(endpoint + meta.image_tag, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  const body = existing.ok ? {} : await existing.json();
  if (
    checkDestination(
      existing.status,
      body,
      existing.headers.get("docker-content-digest"),
      final.digest,
    ) === "create"
  ) {
    const response = await fetch(endpoint + meta.image_tag, {
      method: "PUT",
      headers: { ...headers, "Content-Type": original.headers.get("content-type") },
      body: bytes,
      signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 201, "Failed to add short image tag");
    assert.equal(response.headers.get("docker-content-digest"), final.digest);
  }
  const verified = await fetch(endpoint + meta.image_tag, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(verified.status, 200);
  assert.equal(verified.headers.get("docker-content-digest"), final.digest);
  console.log(
    `${meta.image}:${meta.image_tag} = ${final.digest}; original image and release unchanged`,
  );
}
module.exports = { checkDestination };
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
