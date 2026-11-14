import { afterAll, beforeAll, expect, test } from "vitest";

import { setLocale } from "~/i18n/locale.server";
import { aclAction } from "~/routes/acls/acl-action";
import { aclLoader } from "~/routes/acls/acl-loader";

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

test("concurrent ACL requests isolate syntax locations and cookie language overrides", async () => {
  const [chinese, english] = await Promise.all([
    app.call(aclAction, "/acls", {
      as: owner,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "save", policy: '{"acls": [' },
    }),
    app.call(aclAction, "/acls", {
      as: `${owner}; ${(await setLocale("en")).split(";")[0]}`,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "save", policy: '{"acls": [' },
    }),
  ]);
  expect(statusOf(chinese)).toBe(400);
  expect(chinese).toMatchObject({
    data: { errors: { form: "语法错误：第 1 行，第 11 列：缺少右方括号" } },
  });
  expect(statusOf(english)).toBe(400);
  expect(english).toMatchObject({
    data: { errors: { form: "Syntax error: Close bracket expected at line 1, column 11" } },
  });
});

test("Chinese ACL forms reject missing, repeated, empty and structurally invalid policy text", async () => {
  const call = (form: Record<string, string | string[]>) =>
    app.call(aclAction, "/acls", { as: owner, headers: { "Accept-Language": "zh-CN" }, form });
  expect(await call({ intent: "save" })).toMatchObject({
    data: { errors: { policy: "请填写此字段。" } },
  });
  expect(await call({ intent: "save", policy: ["{}", "{}"] })).toMatchObject({
    data: { errors: { policy: "请输入策略文本。" } },
  });
  expect(await call({ intent: "save", policy: " \n " })).toMatchObject({
    data: { errors: { policy: "策略不能为空。" } },
  });
  expect(await call({ intent: "save", policy: "[]" })).toMatchObject({
    data: { errors: { form: "语法错误：策略必须是 JSON 对象" } },
  });
  expect(await call({ intent: "not-an-intent", policy: "{}" })).toMatchObject({
    data: { errors: { form: "不支持此操作。" } },
  });
});

test("language preferences cannot give readers or members permission to write a policy", async () => {
  for (const role of ["viewer", "auditor", "it_admin", "member"] as const) {
    const { cookie } = await app.signIn(role);
    const result = await app.call(aclAction, "/acls", {
      as: cookie,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "save", policy: "{}" },
    });
    expect(statusOf(result)).toBe(403);
    expect(result).toMatchObject({ data: { errors: { form: "没有执行此操作的权限。" } } });
    if (role === "viewer" || role === "member") {
      expect(
        statusOf(
          await app.call(aclLoader, "/acls", {
            as: cookie,
            headers: { "Accept-Language": "zh-CN" },
          }),
        ),
      ).toBe(403);
    }
  }
});

test("Chinese ACL saves report a real refused Headscale connection after local validation", async () => {
  const { cookie } = await app.signIn("network_admin");
  const result = await app.call(aclAction, "/acls", {
    as: cookie,
    headers: { "Accept-Language": "zh-CN" },
    form: { intent: "save", policy: '{"acls":[]}' },
  });
  expect(statusOf(result)).toBe(400);
  expect(result).toMatchObject({
    data: { errors: { form: "无法连接到 Headscale，请确认服务正在运行后重试。" } },
  });
});
