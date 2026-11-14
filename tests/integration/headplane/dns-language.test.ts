import { readFile } from "node:fs/promises";

import { expect, test } from "vitest";
import { parse, stringify } from "yaml";

import { setLocale } from "~/i18n/locale.server";
import { dnsAction } from "~/routes/dns/dns-actions";
import { loader } from "~/routes/dns/overview";

import { createTestApp, statusOf } from "../../support/app";
import { tempFile } from "../../support/temp";

async function open(options: { noServers?: boolean; inline?: boolean; noConfig?: boolean } = {}) {
  const recordsPath = await tempFile(
    "records.json",
    JSON.stringify([{ type: "TXT", name: "raw.example", value: "keep original" }]),
  );
  const configPath = await tempFile(
    "config.yaml",
    "# Keep this operator comment\n" +
      stringify({
        server_url: "https://headscale.example.com",
        dns: {
          base_domain: "tailnet.test",
          magic_dns: true,
          override_local_dns: false,
          nameservers: {
            global: options.noServers ? [] : ["1.1.1.1", "9.9.9.9"],
            split: { "corp.example": ["10.0.0.53", "10.0.0.54"] },
          },
          search_domains: ["corp.example", "lab.example"],
          ...(options.inline
            ? { extra_records: [{ type: "A", name: "inline.example", value: "100.64.0.8" }] }
            : { extra_records_path: recordsPath }),
        },
        custom_operator_setting: "unchanged",
      }),
  );
  const app = await createTestApp({
    headscale: { url: "http://127.0.0.1:1", apiKey: "unused" },
    config: {
      server: { base_path: "/network/control" },
      ...(!options.noConfig ? { headscale: { config_path: configPath } } : {}),
    },
  });
  const owner = (await app.signIn("owner")).cookie;
  return {
    app,
    owner,
    configPath,
    recordsPath,
    call: (form: Record<string, string | string[]>, locale = "zh-CN", as = owner) =>
      app.call(dnsAction, "/dns", { as, headers: { "Accept-Language": locale }, form }),
    written: async () => parse(await readFile(configPath, "utf8")),
    async [Symbol.asyncDispose]() {
      await app.dispose();
      // The file-backed SQLite handle must be closed before tempDir cleanup on Windows.
      app.ctx.db.$client.close();
    },
  };
}

test("Chinese DNS edits write original identifiers, order and scopes while preserving other YAML", async () => {
  await using fixture = await open();
  const { app, call, written, configPath, owner } = fixture;
  expect(await call({ intent: "rename_tailnet", name: " renamed.test " })).toMatchObject({
    ok: true,
    message: "Tailnet 已重命名",
  });
  expect(await call({ intent: "toggle_magic", enabled: "false" })).toMatchObject({
    ok: true,
    message: "Magic DNS 已停用",
  });
  expect(await call({ intent: "toggle_magic", enabled: "true" })).toMatchObject({
    ok: true,
    message: "Magic DNS 已启用",
  });
  expect(await call({ intent: "override_dns", enabled: "true" })).toMatchObject({
    ok: true,
    message: "DNS 覆盖设置已更新",
  });
  expect(await call({ intent: "add_ns", nameserver: " 2001:db8::53 " })).toMatchObject({
    ok: true,
    message: "DNS 服务器已添加",
  });
  expect(
    statusOf(await call({ intent: "move_ns", nameserver: "2001:db8::53", direction: "up" })),
  ).toBe(200);
  expect((await written()).dns.nameservers.global).toEqual(["1.1.1.1", "2001:db8::53", "9.9.9.9"]);
  expect(
    statusOf(
      await call({
        intent: "move_ns",
        nameserver: "10.0.0.54",
        split_domain: "corp.example",
        direction: "up",
      }),
    ),
  ).toBe(200);
  expect((await written()).dns.nameservers.split).toEqual({
    "corp.example": ["10.0.0.54", "10.0.0.53"],
  });
  expect(await call({ intent: "remove_ns", nameserver: "2001:db8::53" })).toMatchObject({
    ok: true,
    message: "DNS 服务器已移除",
  });
  expect(
    await call({ intent: "add_ns", nameserver: "10.10.0.53", split_domain: " temporary.example " }),
  ).toMatchObject({ ok: true });
  expect(
    statusOf(
      await call({
        intent: "remove_ns",
        nameserver: "10.10.0.53",
        split_domain: "temporary.example",
      }),
    ),
  ).toBe(200);
  expect(await call({ intent: "add_domain", domain: " extra.example " })).toMatchObject({
    ok: true,
    message: "搜索域已添加",
  });
  expect(
    statusOf(await call({ intent: "move_domain", domain: "extra.example", direction: "up" })),
  ).toBe(200);
  expect((await written()).dns.search_domains).toEqual([
    "corp.example",
    "extra.example",
    "lab.example",
  ]);
  expect(await call({ intent: "remove_domain", domain: "extra.example" })).toMatchObject({
    ok: true,
    message: "搜索域已移除",
  });
  expect(await written()).toMatchObject({
    custom_operator_setting: "unchanged",
    server_url: "https://headscale.example.com",
    dns: {
      base_domain: "renamed.test",
      magic_dns: true,
      override_local_dns: true,
      nameservers: {
        global: ["1.1.1.1", "9.9.9.9"],
        split: { "corp.example": ["10.0.0.54", "10.0.0.53"] },
      },
      search_domains: ["corp.example", "lab.example"],
    },
  });
  expect(await readFile(configPath, "utf8")).toContain("# Keep this operator comment");
  expect(await app.call(loader, "/dns", { as: owner })).toMatchObject({
    baseDomain: "renamed.test",
    access: true,
    writable: true,
    isAutoApplied: false,
  });
});

test("DNS locale isolation and malformed forms cannot change configuration", async () => {
  await using fixture = await open();
  const { app, owner, call, configPath } = fixture;
  const before = await readFile(configPath, "utf8");
  const [chinese, english] = await Promise.all([
    call({ intent: "add_ns", nameserver: "dns.example.com" }),
    app.call(dnsAction, "/dns", {
      as: `${owner}; ${(await setLocale("en")).split(";")[0]}`,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "add_ns", nameserver: "dns.example.com" },
    }),
  ]);
  expect(chinese).toMatchObject({ data: { errors: { nameserver: "请输入 IPv4 或 IPv6 地址。" } } });
  expect(english).toMatchObject({
    data: { errors: { nameserver: "Enter an IPv4 or IPv6 address." } },
  });
  for (const [form, errors] of [
    [{ intent: "add_ns" }, { nameserver: "请填写此字段。" }],
    [
      { intent: "add_ns", nameserver: ["1.1.1.1", "9.9.9.9"] },
      { nameserver: "请输入 IPv4 或 IPv6 地址。" },
    ],
    [{ intent: "add_domain", domain: " " }, { domain: "请输入搜索域。" }],
    [{ intent: "rename_tailnet", name: " " }, { name: "请输入 Tailnet 名称。" }],
    [{ intent: "toggle_magic", enabled: "yes" }, { enabled: "请选择是否启用此设置。" }],
    [
      { intent: "move_domain", domain: "corp.example", direction: "left" },
      { direction: "请选择有效的移动方向。" },
    ],
    [
      { intent: "add_record", type: "CNAME", name: "alias.example", value: "target.example" },
      { type: "请选择记录类型。" },
    ],
    [
      { intent: "add_ns", nameserver: "1.0.0.1", split_domain: ["one.example", "two.example"] },
      { split_domain: "请输入域名。" },
    ],
    [{ intent: "unknown" }, { form: "不支持此操作。" }],
  ] as const) {
    const result = await call(form as Record<string, string | string[]>);
    expect(statusOf(result)).toBe(400);
    expect(result).toMatchObject({ data: { errors } });
  }
  expect(await readFile(configPath, "utf8")).toBe(before);
});

test("Chinese DNS record forms preserve address families and the other records without rewriting YAML", async () => {
  await using fixture = await open();
  const { call, configPath, recordsPath } = fixture;
  const yaml = await readFile(configPath, "utf8");
  expect(
    await call({ intent: "add_record", type: "A", name: " dual.example ", value: " 100.64.0.1 " }),
  ).toMatchObject({ ok: true, message: "记录已添加" });
  expect(
    await call({ intent: "add_record", type: "AAAA", name: "dual.example", value: " fd7a::1 " }),
  ).toMatchObject({ ok: true, message: "记录已添加" });
  const before = await readFile(recordsPath, "utf8");
  for (const [type, value, errors] of [
    ["A", "100.64.0.2", { name: "此域名已存在 A 记录。" }],
    ["AAAA", "fd7a::2", { name: "此域名已存在 AAAA 记录。" }],
    ["A", "fd7a::1", { value: "请输入 IPv4 地址。" }],
    ["AAAA", "100.64.0.1", { value: "请输入 IPv6 地址。" }],
  ] as const) {
    expect(await call({ intent: "add_record", type, name: "dual.example", value })).toMatchObject({
      data: { errors },
    });
    expect(await readFile(recordsPath, "utf8")).toBe(before);
  }
  expect(await call({ intent: "remove_record", type: "A", name: "dual.example" })).toMatchObject({
    ok: true,
    message: "记录已移除",
  });
  expect(JSON.parse(await readFile(recordsPath, "utf8"))).toEqual([
    { type: "TXT", name: "raw.example", value: "keep original" },
    { type: "AAAA", name: "dual.example", value: "fd7a::1" },
  ]);
  expect(await readFile(configPath, "utf8")).toBe(yaml);
});

test("Chinese stale-item and list-edge errors leave DNS files unchanged", async () => {
  await using fixture = await open();
  const { call, configPath, recordsPath } = fixture;
  const yaml = await readFile(configPath, "utf8");
  const records = await readFile(recordsPath, "utf8");
  for (const [form, message] of [
    [{ intent: "add_ns", nameserver: "1.1.1.1" }, "此 DNS 服务器已在列表中。"],
    [{ intent: "remove_ns", nameserver: "192.0.2.1" }, "此 DNS 服务器已不在列表中。"],
    [
      { intent: "move_ns", nameserver: "192.0.2.1", direction: "up" },
      "此 DNS 服务器已不在列表中。",
    ],
    [
      { intent: "move_ns", nameserver: "1.1.1.1", direction: "up" },
      "此 DNS 服务器已位于列表首位。",
    ],
    [
      { intent: "move_ns", nameserver: "9.9.9.9", direction: "down" },
      "此 DNS 服务器已位于列表末位。",
    ],
    [{ intent: "add_domain", domain: "corp.example" }, "此搜索域已在列表中。"],
    [{ intent: "remove_domain", domain: "gone.example" }, "此搜索域已不在列表中。"],
    [{ intent: "move_domain", domain: "gone.example", direction: "up" }, "此搜索域已不在列表中。"],
    [
      { intent: "move_domain", domain: "corp.example", direction: "up" },
      "此搜索域已位于列表首位。",
    ],
    [
      { intent: "move_domain", domain: "lab.example", direction: "down" },
      "此搜索域已位于列表末位。",
    ],
    [{ intent: "remove_record", type: "A", name: "gone.example" }, "此记录已不在列表中。"],
  ] as const) {
    const result = await call(form);
    expect(statusOf(result)).toBe(400);
    expect(result).toMatchObject({
      data: {
        errors: {
          [form.intent === "add_ns"
            ? "nameserver"
            : form.intent === "add_domain"
              ? "domain"
              : "form"]: message,
        },
      },
    });
  }
  expect(await readFile(configPath, "utf8")).toBe(yaml);
  expect(await readFile(recordsPath, "utf8")).toBe(records);
});

test("Chinese DNS override guards prevent an unusable configuration and allow recovery", async () => {
  await using fixture = await open({ noServers: true });
  const { call, written, configPath } = fixture;
  const before = await readFile(configPath, "utf8");
  expect(await call({ intent: "override_dns", enabled: "true" })).toMatchObject({
    data: { errors: { form: "覆盖本地 DNS 前，请先添加全局 DNS 服务器。" } },
  });
  expect(await readFile(configPath, "utf8")).toBe(before);
  await call({ intent: "add_ns", nameserver: "1.1.1.1" });
  await call({ intent: "override_dns", enabled: "true" });
  expect(await call({ intent: "remove_ns", nameserver: "1.1.1.1" })).toMatchObject({
    data: { errors: { form: "覆盖本地 DNS 至少需要一台全局 DNS 服务器。请先关闭覆盖设置。" } },
  });
  expect((await written()).dns).toMatchObject({
    override_local_dns: true,
    nameservers: { global: ["1.1.1.1"] },
  });
  await call({ intent: "override_dns", enabled: "false" });
  expect(statusOf(await call({ intent: "remove_ns", nameserver: "1.1.1.1" }))).toBe(200);
  expect((await written()).dns).toMatchObject({
    override_local_dns: false,
    nameservers: { global: [] },
  });
});

test("Chinese preferences cannot grant DNS write access or expose settings to members", async () => {
  await using fixture = await open();
  const { app, call, owner, configPath, recordsPath } = fixture;
  const yaml = await readFile(configPath, "utf8");
  const records = await readFile(recordsPath, "utf8");
  for (const role of ["it_admin", "auditor", "viewer", "member"] as const) {
    const { cookie } = await app.signIn(role);
    for (const form of Array.of<Record<string, string>>(
      { intent: "rename_tailnet", name: "blocked.test" },
      { intent: "add_record", type: "A", name: "blocked.example", value: "100.64.0.1" },
    )) {
      const result = await call(form, "zh-CN", cookie);
      expect(statusOf(result)).toBe(403);
      expect(result).toMatchObject({ data: { errors: { form: "没有执行此操作的权限。" } } });
    }
    const result = await app.call(loader, "/dns", { as: cookie });
    if (role === "member" || role === "viewer") expect(statusOf(result)).toBe(403);
    else expect(result).toMatchObject({ access: false });
  }
  expect(await app.call(loader, "/dns", { as: owner })).toMatchObject({ access: true });
  expect(await readFile(configPath, "utf8")).toBe(yaml);
  expect(await readFile(recordsPath, "utf8")).toBe(records);
});

test("Chinese inline-record restrictions and an unavailable config remain read-only", async () => {
  await using fixture = await open({ inline: true });
  const { app, call, configPath, owner } = fixture;
  const before = await readFile(configPath, "utf8");
  expect(await app.call(loader, "/dns", { as: owner })).toMatchObject({
    hasRecordsFile: false,
    recordsWritable: false,
  });
  for (const form of Array.of<Record<string, string>>(
    { intent: "add_record", type: "A", name: "new.example", value: "100.64.0.1" },
    { intent: "remove_record", type: "A", name: "inline.example" },
  )) {
    const result = await call(form);
    expect(statusOf(result)).toBe(403);
    expect(result).toMatchObject({
      data: { errors: { form: "DNS 记录只能通过 dns.extra_records_path 指定的文件修改。" } },
    });
  }
  expect(await readFile(configPath, "utf8")).toBe(before);
  await using missing = await open({ noConfig: true });
  expect(statusOf(await missing.app.call(loader, "/dns", { as: missing.owner }))).toBe(404);
  const denied = await missing.call({ intent: "rename_tailnet", name: "renamed.test" });
  expect(statusOf(denied)).toBe(403);
  expect(denied).toMatchObject({ data: { errors: { form: "Headscale 配置为只读。" } } });
});
