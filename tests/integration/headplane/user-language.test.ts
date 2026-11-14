import { afterAll, beforeAll, expect, test } from "vitest";

import { setLocale } from "~/i18n/locale.server";
import { loader } from "~/routes/users/overview";
import { userAction } from "~/routes/users/user-actions";

import { createTestApp, statusOf, type TestApp } from "../../support/app";

let app: TestApp;
let owner: { userId: string; cookie: string };
beforeAll(async () => {
  app = await createTestApp({
    headscale: { url: "http://127.0.0.1:1", apiKey: "unused" },
    config: { server: { base_path: "/network/control" } },
  });
  owner = await app.signIn("owner");
});
afterAll(async () => {
  await app?.dispose();
});

test("concurrent requests isolate validation languages and honor the saved preference", async () => {
  const [chinese, english] = await Promise.all([
    app.call(userAction, "/users", {
      as: owner.cookie,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "create", name: ["alice", "bob"] },
    }),
    app.call(userAction, "/users", {
      as: `${owner.cookie}; ${(await setLocale("en")).split(";")[0]}`,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "rename", headscale_user_id: "1", name: "lm@" },
    }),
  ]);
  expect(statusOf(chinese)).toBe(400);
  expect(chinese).toMatchObject({ data: { ok: false, errors: { name: "请输入有效的用户名。" } } });
  expect(statusOf(english)).toBe(400);
  expect(english).toMatchObject({
    data: { ok: false, errors: { name: "Enter a valid username." } },
  });
});

test("a Chinese preference cannot grant user or policy write permissions", async () => {
  const viewer = await app.signIn("viewer");
  const itAdmin = await app.signIn("it_admin");
  for (const [cookie, form] of [
    [viewer.cookie, { intent: "reassign", headplane_user_id: owner.userId, role: "admin" }],
    [itAdmin.cookie, { intent: "update_groups", user_name: "alice", groups: "group:eng" }],
  ] as const) {
    const result = await app.call(userAction, "/users", {
      as: `${cookie}; ${(await setLocale("zh-CN")).split(";")[0]}`,
      form,
    });
    expect(statusOf(result)).toBe(403);
    expect(result).toMatchObject({ data: { errors: { form: "没有执行此操作的权限。" } } });
  }
  expect((await app.ctx.auth.listUsers()).find((user) => user.id === owner.userId)?.role).toBe(
    "owner",
  );
});

test("Chinese role edits protect the owner and reject forged roles and repeated identifiers", async () => {
  const call = (form: Record<string, string | string[]>) =>
    app.call(userAction, "/users", {
      as: owner.cookie,
      headers: { "Accept-Language": "zh-CN" },
      form,
    });
  const protectedOwner = await call({
    intent: "reassign",
    headplane_user_id: owner.userId,
    role: "member",
  });
  expect(statusOf(protectedOwner)).toBe(403);
  expect(protectedOwner).toMatchObject({
    data: { errors: { form: "如需更改所有者的角色，请转移所有权。" } },
  });
  expect(
    await call({ intent: "reassign", headplane_user_id: owner.userId, role: "owner" }),
  ).toMatchObject({
    data: { errors: { role: "请选择角色。" } },
  });
  expect(
    await call({ intent: "reassign", headplane_user_id: [owner.userId, "another"], role: "admin" }),
  ).toMatchObject({
    data: { errors: { headplane_user_id: "请选择用户。" } },
  });
  expect(
    await call({ intent: "create", name: "alice", display_name: ["Alice", "Bob"] }),
  ).toMatchObject({
    data: { errors: { display_name: "请输入文本值。" } },
  });
  expect(await call({ intent: "link", headplane_user_id: owner.userId })).toMatchObject({
    data: { errors: { headscale_user_id: "请填写此字段。" } },
  });
});

test("only the current owner can transfer ownership, including with a Chinese API-key session", async () => {
  const admin = await app.signIn("admin");
  const apiKey = await app.signInWithApiKey();
  for (const cookie of [admin.cookie, apiKey.cookie]) {
    const result = await app.call(userAction, "/users", {
      as: cookie,
      headers: { "Accept-Language": "zh-CN" },
      form: { intent: "transfer", headplane_user_id: admin.userId },
    });
    expect(statusOf(result)).toBe(403);
    expect(result).toMatchObject({ data: { errors: { form: "只有所有者可以转移所有权。" } } });
  }
  const transfer = await app.call(userAction, "/users", {
    as: owner.cookie,
    headers: { "Accept-Language": "zh-CN" },
    form: { intent: "transfer", headplane_user_id: admin.userId },
  });
  expect(transfer).toEqual({ ok: true, message: "所有权已转移", data: undefined });
  const accounts = await app.ctx.auth.listUsers();
  expect(accounts.find((user) => user.id === owner.userId)?.role).toBe("admin");
  expect(accounts.find((user) => user.id === admin.userId)?.role).toBe("owner");
  const restore = await app.call(userAction, "/users", {
    as: admin.cookie,
    form: { intent: "transfer", headplane_user_id: owner.userId },
  });
  expect(restore).toMatchObject({ ok: true, message: "Ownership transferred" });
});

test("Chinese validation reports invalid groups without changing the policy", async () => {
  const result = await app.call(userAction, "/users", {
    as: owner.cookie,
    headers: { "Accept-Language": "zh-CN" },
    form: { intent: "update_groups", user_name: "alice", groups: ["group:eng", "Admins"] },
  });
  // No policy request can succeed against this refused connection.
  expect(statusOf(result)).toBe(400);
  expect(result).toMatchObject({ data: { errors: { form: "用户组名称无效：Admins" } } });
});

test("Chinese failures retain local accounts when the real Headscale connection is refused", async () => {
  const page = (await app.call(loader, "/users", {
    as: owner.cookie,
    headers: { "Accept-Language": "zh-CN" },
  })) as Awaited<ReturnType<typeof loader>>;
  expect(page.apiError).toBe(
    "无法连接到 Headscale API，暂时无法获取 Headscale 用户数据和设备信息。",
  );
  expect(page.headplaneUsers.find((user) => user.id === owner.userId)).toMatchObject({
    role: "owner",
  });
  expect(page.canEditGroups).toBe(false);
  expect(page.unlinkedHeadscaleUsers).toEqual([]);
  const result = await app.call(userAction, "/users", {
    as: owner.cookie,
    headers: { "Accept-Language": "zh-CN" },
    form: { intent: "create", name: "有效用户名" },
  });
  expect(statusOf(result)).toBe(400);
  expect(result).toMatchObject({
    data: { errors: { form: "无法连接到 Headscale，请确认服务正在运行后重试。" } },
  });
});
