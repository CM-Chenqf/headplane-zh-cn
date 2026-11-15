// Real runtime acceptance for the exact image, not a mocked Headscale response.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const image = process.env.SMOKE_IMAGE;
const platform = process.env.SMOKE_PLATFORM;
if (!image || !/^linux\/(amd64|arm64)$/.test(platform ?? ""))
  throw new Error("Set SMOKE_IMAGE and SMOKE_PLATFORM");
const mainHarness = existsSync("tests/harness/versions.ts");
const versionFile = mainHarness ? "tests/harness/versions.ts" : "tests/integration/setup/env.ts";
const text = readFileSync(versionFile, "utf8");
const declaration = text.match(
  new RegExp(
    `export const ${mainHarness ? "HEADSCALE_VERSIONS" : "HS_VERSIONS"} = (\\[[^\\]]+\\]) as const;`,
  ),
);
if (!declaration)
  throw new Error("Cannot read canonical Headscale version matrix; update the harness adapter");
const versions = JSON.parse(declaration[1]);
if (!versions.length || !versions.every((v) => /^\d+\.\d+\.\d+$/.test(v)))
  throw new Error("Invalid Headscale versions");
const { startHeadscale } = await import(
  pathToFileURL(
    resolve(
      mainHarness ? "tests/harness/headscale.ts" : "tests/integration/setup/start-headscale.ts",
    ),
  )
);
assert.equal(docker("image", "inspect", image, "--format", "{{.Os}}/{{.Architecture}}"), platform);

async function freePort() {
  const server = createServer();
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  return port;
}

for (const version of versions) {
  const directory = mkdtempSync(join(tmpdir(), "hp-image-smoke-"));
  const name = `hp-smoke-${randomBytes(6).toString("hex")}`;
  let headscale;
  try {
    headscale = mainHarness
      ? await startHeadscale({ version, id: name, tls: false })
      : await startHeadscale(version);
    const port = await freePort();
    const origin = `http://127.0.0.1:${port}`;
    const base = `${origin}/admin`;
    writeFileSync(
      join(directory, "config.yaml"),
      JSON.stringify({
        server: {
          host: "0.0.0.0",
          port,
          base_url: origin,
          ...(mainHarness ? { base_path: "/admin" } : {}),
          cookie_secret: randomBytes(16).toString("hex"),
          cookie_secure: false,
          data_path: "/var/lib/headplane",
        },
        headscale: { url: headscale.url ?? headscale.apiUrl, api_key: headscale.apiKey },
        integration: { agent: { enabled: false } },
      }),
    );
    docker(
      "run",
      "-d",
      "--name",
      name,
      "--platform",
      platform,
      "--network",
      "host",
      "--mount",
      `type=bind,source=${directory},target=/etc/headplane,readonly`,
      "-e",
      "HEADPLANE_CONFIG_PATH=/etc/headplane/config.yaml",
      image,
    );
    const deadline = Date.now() + 120_000;
    let ready = false;
    while (Date.now() < deadline) {
      try {
        ready = (await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(5000) })).ok;
      } catch {
        /* startup */
      }
      if (ready) break;
      if (docker("inspect", name, "--format", "{{.State.Running}}") !== "true")
        throw new Error("Headplane exited during startup");
      await setTimeout(1000);
    }
    assert.ok(ready, "Headplane and real Headscale health must pass");
    docker("exec", name, "/bin/hp_healthcheck");
    // Each upstream line keeps its own sign-in UI and wording.
    const titles = mainHarness
      ? [
          ["en", "Sign in to Headplane"],
          ["zh-CN", "登录 Headplane"],
        ]
      : [
          ["en", "Welcome to Headplane"],
          ["zh-CN", "欢迎使用 Headplane"],
        ];
    for (const [locale, title] of titles) {
      const response = await fetch(`${base}/login`, { headers: { "Accept-Language": locale } });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes(title), `Missing ${locale} login title`);
      assert.ok(html.includes(`lang="${locale}"`), `Incorrect ${locale} HTML language`);
    }
    const login = await fetch(`${base}/login`, {
      method: "POST",
      redirect: "manual",
      headers: { Origin: origin },
      body: new URLSearchParams({ api_key: headscale.apiKey }),
    });
    assert.ok([302, 303].includes(login.status), "Real API key login must redirect");
    assert.ok(login.headers.get("location")?.endsWith("/machines"));
    const cookies = login.headers
      .getSetCookie()
      .map((s) => s.split(";")[0])
      .join("; ");
    assert.ok(cookies, "Login must create a session");
    const machines = await fetch(`${base}/machines`, {
      redirect: "manual",
      headers: { Cookie: cookies, "Accept-Language": "zh-CN" },
    });
    assert.equal(machines.status, 200, "Authenticated Machines page must load");
    console.log(
      `${platform} ${image}: Headscale ${version}, healthcheck, EN/中文 sign-in and authenticated Machines passed`,
    );
  } catch (error) {
    // Never expose the real test API key in logs.
    try {
      console.error(
        docker("logs", name).replaceAll(headscale?.apiKey ?? "__no_key__", "[REDACTED]"),
      );
    } catch {
      /* no container */
    }
    throw error;
  } finally {
    try {
      docker("rm", "-f", name);
    } catch {
      /* startup may have failed */
    }
    if (headscale) {
      if (mainHarness) await headscale.stop();
      else await headscale.container.stop({ remove: true, removeVolumes: true });
    }
    rmSync(directory, { recursive: true, force: true });
  }
}
