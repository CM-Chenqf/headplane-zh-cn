const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { publishedVersions, parseTag } = require("./fork-release.cjs");

function siteReleases(releases) {
  const seen = new Set();
  return publishedVersions(releases).filter((tag) => {
    const minor = parseTag(tag).minor;
    if (seen.has(minor)) return false;
    seen.add(minor);
    return true;
  });
}

function assemble(repository, output) {
  if (repository !== "CM-Chenqf/headplane-zh-cn")
    throw new Error("Unexpected documentation repository");
  const gh = (...args) =>
    execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
  const all = JSON.parse(
    gh("api", "--paginate", "--slurp", `repos/${repository}/releases?per_page=100`),
  ).flat();
  const releases = siteReleases(all);
  if (!releases.length)
    throw new Error("No published community releases with archived documentation");
  const scratch = mkdtempSync(join(tmpdir(), "headplane-docs-site-"));
  const site = resolve(output);
  mkdirSync(site, { recursive: true });
  try {
    const versions = [];
    for (const [index, tag] of releases.entries()) {
      const { minor, version } = parseTag(tag);
      const directory = join(scratch, tag);
      mkdirSync(directory);
      const archive = index === 0 ? "docs-root.tar.gz" : "docs-archive.tar.gz";
      gh(
        "release",
        "download",
        tag,
        "--repo",
        repository,
        "--dir",
        directory,
        "--pattern",
        "release-manifest.json",
        "--pattern",
        archive,
      );
      const manifest = JSON.parse(readFileSync(join(directory, "release-manifest.json"), "utf8"));
      if (
        manifest.schemaVersion !== 1 ||
        manifest.repository !== repository ||
        manifest.tag !== tag ||
        !manifest.unofficial
      )
        throw new Error(`Invalid release manifest for ${tag}`);
      const actual = createHash("sha256")
        .update(readFileSync(join(directory, archive)))
        .digest("hex");
      if (actual !== manifest.assets?.[archive]?.sha256)
        throw new Error(`Documentation checksum mismatch for ${tag}`);
      const target = index === 0 ? site : join(site, minor);
      mkdirSync(target, { recursive: true });
      const entries = execFileSync("tar", ["-tzf", join(directory, archive)], {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      })
        .trim()
        .split("\n");
      if (entries.some((p) => p.startsWith("/") || p.includes("\\") || p.split("/").includes("..")))
        throw new Error("Unsafe documentation archive");
      execFileSync("tar", [
        "-xzf",
        join(directory, archive),
        "--no-same-owner",
        "--no-same-permissions",
        "-C",
        target,
      ]);
      versions.push({
        version: `${version}-zh.${parseTag(tag).revision}`,
        path: index === 0 ? "/" : `/${minor}/`,
      });
      if (index > 0)
        appendFileSync(join(site, "_headers"), `\n/${minor}/*\n  X-Robots-Tag: noindex\n`);
    }
    appendFileSync(join(site, "_redirects"), `\n/${parseTag(releases[0]).minor}/* /:splat 302\n`);
    appendFileSync(join(site, "_headers"), "\n/versions.json\n  Access-Control-Allow-Origin: *\n");
    writeFileSync(join(site, "versions.json"), JSON.stringify(versions, null, 2) + "\n");
    console.log(JSON.stringify(versions));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

module.exports = { siteReleases };
if (require.main === module) {
  try {
    assemble(process.env.GITHUB_REPOSITORY, process.argv[2] ?? "site");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
