import { afterAll, beforeAll, expect, test } from "vitest";

import { setLocale } from "~/i18n/locale.server";
import { machineAction } from "~/routes/machines/machine-actions";

import { createTestApp, statusOf, type TestApp } from "../../support/app";

let app: TestApp;
let owner: string;
beforeAll(async () => {
  app = await createTestApp({
    headscale: { url: "http://127.0.0.1:1", apiKey: "unused" },
    config: { server: { base_path: "/network/control" } },
  });
  owner = (await app.signIn("owner")).cookie;
});
afterAll(async () => {
  await app?.dispose();
});

test("concurrent form requests keep schema errors and cookie overrides isolated", async () => {
  const [chinese, english] = await Promise.all([
    app.call(machineAction, "/machines", {
      as: owner,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "rename", node_id: "1", name: ["valid", "another"] },
    }),
    app.call(machineAction, "/machines", {
      as: `${owner}; ${(await setLocale("en")).split(";")[0]}`,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "rename", node_id: "1", name: "invalid name" },
    }),
  ]);
  expect(statusOf(chinese)).toBe(400);
  expect(chinese).toMatchObject({
    data: {
      ok: false,
      errors: {
        name: "只能使用英文字母、数字和连字符，且必须以字母或数字开头和结尾。",
      },
    },
  });
  expect(statusOf(english)).toBe(400);
  expect(english).toMatchObject({
    data: {
      ok: false,
      errors: {
        name: "Use letters, numbers, and hyphens only, starting and ending with a letter or number.",
      },
    },
  });
});

test("a Chinese preference cannot grant write access to a viewer", async () => {
  const viewer = (await app.signIn("viewer")).cookie;
  const result = await app.call(machineAction, "/machines", {
    as: `${viewer}; ${(await setLocale("zh-CN")).split(";")[0]}`,
    form: { intent: "register", register_key: "hskey-authreq-anything", user: "alice@" },
  });
  expect(statusOf(result)).toBe(403);
  expect(result).toMatchObject({ data: { ok: false, errors: { form: "没有执行此操作的权限。" } } });
});

test("unknown intents and malformed registration input return Chinese form errors", async () => {
  const call = (form: Record<string, string>) =>
    app.call(machineAction, "/machines", {
      as: owner,
      form,
      headers: { "Accept-Language": "zh-CN" },
    });
  expect(await call({ intent: "not-an-intent" })).toMatchObject({
    data: {
      ok: false,
      errors: { form: "不支持此操作。" },
    },
  });
  expect(await call({ intent: "register", register_key: "", user: "" })).toMatchObject({
    data: {
      ok: false,
      errors: { register_key: "请粘贴设备注册密钥。", user: "请选择所有者。" },
    },
  });
  expect(
    await call({ intent: "register", register_key: "tailscale up", user: "alice@" }),
  ).toMatchObject({
    data: {
      ok: false,
      errors: {
        register_key: "请粘贴 tailscale up 输出的设备注册 URL 或完整的 hskey-authreq-... 密钥。",
      },
    },
  });
});

test("an authenticated Chinese action explains a real refused connection", async () => {
  const result = await app.call(machineAction, "/machines", {
    as: owner,
    headers: { "Accept-Language": "zh-CN" },
    form: { intent: "rename", node_id: "1", name: "valid-name" },
  });
  expect(statusOf(result)).toBe(400);
  expect(result).toMatchObject({
    data: {
      ok: false,
      errors: {
        form: "无法连接到 Headscale，请确认服务正在运行后重试。",
      },
    },
  });
});
