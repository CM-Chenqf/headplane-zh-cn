import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import type { Locale } from "~/i18n/locale";
import { aclAction } from "~/routes/acls/acl-action";
import { aclLoader } from "~/routes/acls/acl-loader";

import { createTailnet, type Tailnet } from "../../harness/tailnet";
import { testedVersions } from "../../harness/versions";
import { waitFor } from "../../harness/wait";
import { statusOf } from "../../support/app";

const ALLOW_ALL = '{"acls":[{"action":"accept","src":["*"],"dst":["*:*"]}]}';

describe("the ACL policy on a real tailnet", () => {
  let tailnet: Tailnet;
  let save: (policy: string, locale?: Locale) => Promise<unknown>;

  beforeAll(async () => {
    tailnet = await createTailnet({ policy: ALLOW_ALL });
    const app = await tailnet.headplane();
    const { cookie } = await app.signIn("owner");
    save = (policy, locale = "en") =>
      app.call(aclAction, "/acls", {
        as: cookie,
        headers: { "Accept-Language": locale },
        form: { intent: "save", policy },
      });
  });

  afterAll(async () => {
    await tailnet?.dispose();
  });

  test("machines stop seeing each other once a saved policy separates them", async () => {
    await tailnet.user("alice@");
    await tailnet.user("bob@");
    const web = await tailnet.node({ name: "web", user: "alice@" });
    const db = await tailnet.node({ name: "db", user: "bob@" });

    const peers = async (node: typeof db) =>
      Object.values(((await node.status()).Peer ?? {}) as Record<string, { HostName: string }>).map(
        (peer) => peer.HostName,
      );

    await waitFor("db to see web", async () => expect(await peers(db)).toContain("web"));

    const policy = '{"acls":[{"action":"accept","src":["alice@"],"dst":["alice@:*"]}]}';
    expect(await save(policy, "zh-CN")).toMatchObject({ ok: true, message: "策略已更新" });

    await waitFor("db to lose web", async () => expect(await peers(db)).not.toContain("web"));
    expect(await peers(web)).not.toContain("db");
  });

  test("a syntax error is reported where it is, keeping the old policy", async () => {
    const before = await tailnet.api.policy.get();

    const result = await save('{"acls": [');

    expect(statusOf(result)).toBe(400);
    expect(result).toMatchObject({
      data: { errors: { form: expect.stringMatching(/^Syntax error: .* at line 1, column 11$/) } },
    });
    expect(await tailnet.api.policy.get()).toEqual(before);
    const chinese = await save('{"acls": [', "zh-CN");
    expect(statusOf(chinese)).toBe(400);
    expect(chinese).toMatchObject({
      data: { errors: { form: "语法错误：第 1 行，第 11 列：缺少右方括号" } },
    });
    expect(await tailnet.api.policy.get()).toEqual(before);
  });

  test("a policy Headscale rejects comes back with its reason, keeping the old policy", async () => {
    const before = await tailnet.api.policy.get();

    const result = await save('{"acls":[{"action":"accept","src":["group:ops"],"dst":["*:*"]}]}');

    expect(statusOf(result)).toBe(400);
    expect(result).toMatchObject({
      data: { errors: { form: expect.stringContaining('"group:ops"') } },
    });
    expect(await tailnet.api.policy.get()).toEqual(before);
    const chinese = await save(
      '{"acls":[{"action":"accept","src":["group:ops"],"dst":["*:*"]}]}',
      "zh-CN",
    );
    expect(statusOf(chinese)).toBe(400);
    expect(chinese).toMatchObject({
      data: { errors: { form: expect.stringMatching(/Headscale 拒绝了此.*HTTP \d{3}/) } },
    });
    expect(chinese).toMatchObject({
      data: { errors: { form: expect.stringContaining('"group:ops"') } },
    });
    expect(await tailnet.api.policy.get()).toEqual(before);
  });
});

describe.for(testedVersions())("where Headscale %s keeps the policy", (version) => {
  async function open(options: Parameters<typeof createTailnet>[0]) {
    const tailnet = await createTailnet({ version, ...options });
    const app = await tailnet.headplane();
    const { cookie } = await app.signIn("owner");

    return {
      tailnet,
      load: () => app.call(aclLoader, "/acls", { as: cookie }),
      save: (policy: string, locale: Locale = "en") =>
        app.call(aclAction, "/acls", {
          as: cookie,
          headers: { "Accept-Language": locale },
          form: { intent: "save", policy },
        }),
    };
  }

  test("a new database policy is empty and editable", async () => {
    const { tailnet, load } = await open({});
    await using _ = tailnet;

    expect(await load()).toMatchObject({ policy: "", writable: true });
  });

  test("a policy file is shown read-only and can't be saved", async () => {
    const file = '// from disk\n{"acls":[]}';
    const { tailnet, load, save } = await open({ policyFile: file });
    await using _ = tailnet;

    expect(await load()).toMatchObject({ policy: file, writable: false });

    const result = await save(ALLOW_ALL);
    expect(statusOf(result)).toBe(403);
    expect(result).toMatchObject({
      data: { errors: { form: expect.stringContaining("The ACL policy is read-only.") } },
    });
    const chinese = await save(ALLOW_ALL, "zh-CN");
    expect(statusOf(chinese)).toBe(403);
    expect(chinese).toMatchObject({
      data: {
        errors: {
          form: "ACL 策略为只读。请在 Headscale 配置中将 `policy.mode` 设为 `database`，以启用策略编辑。",
        },
      },
    });

    const path = join(dirname(tailnet.server.configPath), "policy.json");
    expect(await readFile(path, "utf8")).toBe(file);
  });

  test("grants save, or are refused with the Headscale version they need", async () => {
    const { tailnet, save } = await open({});
    await using _ = tailnet;

    const policy = '{"grants":[{"src":["*"],"dst":["*"],"ip":["*"]}]}';
    const result = await save(policy);
    const chinese = await save(policy, "zh-CN");

    if (tailnet.headscale.capabilities.policySupportsGrants) {
      expect(statusOf(result)).toBe(200);
      expect(chinese).toMatchObject({ ok: true, message: "策略已更新" });
      expect(JSON.parse((await tailnet.api.policy.get()).policy)).toEqual(JSON.parse(policy));
      return;
    }

    expect(statusOf(result)).toBe(400);
    expect(statusOf(chinese)).toBe(400);
    expect(chinese).toMatchObject({
      data: {
        errors: {
          form: "授权规则需要 Headscale 0.29 或更新版本。请移除 `grants` 部分或升级 Headscale。",
        },
      },
    });
    expect(result).toMatchObject({
      data: { errors: { form: expect.stringContaining("Grants need Headscale 0.29 or newer.") } },
    });
  });

  // Headscale's default configuration.
  test("file mode without a file is read-only rather than an empty editable policy", async () => {
    const { tailnet, load } = await open({
      headscaleConfig: { policy: { mode: "file", path: "" } },
    });
    await using _ = tailnet;

    expect(await load()).toMatchObject({ policy: "", writable: false });
  });
});
