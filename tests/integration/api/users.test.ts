import { RouterContextProvider } from "react-router";
import { describe, expect, onTestFinished, test } from "vitest";

import { setLocale } from "~/i18n/locale.server";
import { userAction } from "~/routes/users/user-actions";
import { authContext, headscaleLiveStoreContext, requestApiContext } from "~/server/context";
import { isDataWithApiError } from "~/server/headscale/api/error-client";
import { createLiveStore, usersResource } from "~/server/headscale/live-store";

import { createTestAuth } from "../../unit/auth/create-auth";
import { getRuntimeClient, HS_VERSIONS } from "../setup/env";

async function routeSession(api: Awaited<ReturnType<typeof getRuntimeClient>>) {
  const { auth } = createTestAuth();
  const ownerId = await auth.findOrCreateUser("integration-owner", { name: "Owner" });
  const memberId = await auth.findOrCreateUser("integration-member", { name: "Member" });
  const ownerCookie = (await auth.createOidcSession(ownerId, { name: "Owner" })).split(";")[0];
  const memberCookie = (await auth.createOidcSession(memberId, { name: "Member" })).split(";")[0];
  const context = new RouterContextProvider();
  const store = createLiveStore([usersResource]);
  onTestFinished(() => store.dispose());
  context.set(authContext, auth);
  context.set(headscaleLiveStoreContext, store);
  context.set(requestApiContext, async (request) => ({
    principal: await auth.require(request),
    api,
  }));
  return {
    auth,
    ownerId,
    memberId,
    async call(fields: Record<string, string>, locale: "en" | "zh-CN", asMember = false) {
      const request = new Request("http://headplane.test/users", {
        method: "POST",
        headers: {
          Cookie: `${asMember ? memberCookie : ownerCookie}; ${(await setLocale(locale)).split(";")[0]}`,
          "Accept-Language": locale === "en" ? "zh-CN" : "en",
        },
        body: new URLSearchParams(fields),
      });
      return userAction({ request, context, params: {} } as never);
    },
  };
}

describe.for(HS_VERSIONS)("Headscale %s: Users", { concurrent: false }, (version) => {
  test("bilingual user actions preserve API data, validation and unlinking on deletion", async () => {
    const api = await getRuntimeClient(version);
    const session = await routeSession(api);
    for (const [locale, suffix, created, renamed, deleted] of [
      ["zh-CN", "zh", "用户已成功创建", "用户已成功重命名", "用户已成功删除"],
      [
        "en",
        "en",
        "User created successfully",
        "User renamed successfully",
        "User deleted successfully",
      ],
    ] as const) {
      const name = `hp-action-${suffix}`;
      expect(
        await session.call(
          {
            action_id: "create_user",
            username: name,
            display_name: "显示名 Display",
            email: `${suffix}@example.com`,
          },
          locale,
        ),
      ).toEqual({ message: created });
      const [user] = await api.users.list({ name });
      expect(user.displayName).toBe("显示名 Display");
      expect(user.email).toBe(`${suffix}@example.com`);
      await session.auth.linkHeadscaleUser(session.memberId, user.id);
      await expect(
        session.call(
          { action_id: "rename_user", headscale_user_id: user.id, new_name: "bad@" },
          locale,
        ),
      ).rejects.toMatchObject({
        init: { status: 400 },
        data: expect.stringMatching(locale === "zh-CN" ? /^用户名/ : /^Usernames/),
      });
      expect((await api.users.list({ name }))[0].id).toBe(user.id);
      expect(
        await session.call(
          { action_id: "rename_user", headscale_user_id: user.id, new_name: `${name}-renamed` },
          locale,
        ),
      ).toEqual({ message: renamed });
      expect((await api.users.list({ name: `${name}-renamed` }))[0].id).toBe(user.id);
      expect(
        await session.call({ action_id: "delete_user", headscale_user_id: user.id }, locale),
      ).toEqual({ message: deleted });
      expect(await api.users.list({ name: `${name}-renamed` })).toEqual([]);
      const login = (await session.auth.listUsers()).find((u) => u.id === session.memberId);
      expect(login?.headscale_user_id).toBeNull();
      expect(login?.sub).toBe("integration-member");
    }
  });

  test("translated permission, linking and ownership results retain real auth boundaries", async () => {
    const api = await getRuntimeClient(version);
    const session = await routeSession(api);
    await expect(
      session.call({ action_id: "create_user", username: "forbidden-user" }, "zh-CN", true),
    ).rejects.toMatchObject({ init: { status: 403 }, data: "没有更新用户的权限" });
    expect(await api.users.list({ name: "forbidden-user" })).toEqual([]);
    const user = await api.users.create({ name: "hp-link-action" });
    try {
      expect(
        await session.call(
          {
            action_id: "link_user",
            headplane_user_id: session.ownerId,
            headscale_user_id: user.id,
          },
          "zh-CN",
        ),
      ).toEqual({ message: "已成功关联 Headscale 用户" });
      await expect(
        session.call(
          {
            action_id: "link_user",
            headplane_user_id: session.memberId,
            headscale_user_id: user.id,
          },
          "en",
        ),
      ).rejects.toMatchObject({
        init: { status: 409 },
        data: "That Headscale user is already linked to another account.",
      });
      expect(
        (await session.auth.listUsers()).find((u) => u.id === session.ownerId)?.headscale_user_id,
      ).toBe(user.id);
      expect(
        (await session.auth.listUsers()).find((u) => u.id === session.memberId)?.headscale_user_id,
      ).toBeNull();
      expect(
        await session.call(
          { action_id: "reassign_user", headplane_user_id: session.memberId, new_role: "admin" },
          "zh-CN",
        ),
      ).toEqual({ message: "用户角色已成功更改" });
      await expect(
        session.call(
          { action_id: "transfer_ownership", headplane_user_id: session.ownerId },
          "zh-CN",
          true,
        ),
      ).rejects.toMatchObject({ init: { status: 403 }, data: "只有所有者可以转移所有权。" });
      expect(
        await session.call(
          { action_id: "transfer_ownership", headplane_user_id: session.memberId },
          "en",
        ),
      ).toEqual({ message: "Ownership transferred successfully" });
      expect(await session.auth.roleForSubject("integration-owner")).toBe("admin");
      expect(await session.auth.roleForSubject("integration-member")).toBe("owner");
    } finally {
      await api.users.delete(user.id);
    }
  });

  test("user action API failures retain upstream status and original diagnostics", async () => {
    const api = await getRuntimeClient(version);
    const session = await routeSession(api);
    for (const locale of ["en", "zh-CN"] as const) {
      const error = await session
        .call({ action_id: "delete_user", headscale_user_id: "999999999" }, locale)
        .catch((e: unknown) => e);
      expect(isDataWithApiError(error)).toBe(true);
      if (!isDataWithApiError(error)) throw error;
      expect(error.data.statusCode).toBeGreaterThanOrEqual(400);
      expect(error.data.rawData.length).toBeGreaterThan(0);
      expect(error.data.requestUrl).toContain("999999999");
    }
  });

  test("bilingual group actions preserve policy contents and require policy-write permission", async () => {
    const api = await getRuntimeClient(version);
    const session = await routeSession(api);
    const invalid = await session.call(
      { action_id: "update_user_groups", user_name: "hp-groups-action", groups: "bad-group" },
      "zh-CN",
    );
    expect(invalid).toMatchObject({
      init: { status: 400 },
      data: { error: "用户组名称无效：bad-group" },
    });
    await session.auth.reassignUser(session.memberId, "it_admin");
    await expect(
      session.call(
        { action_id: "update_user_groups", user_name: "hp-groups-action", groups: "group:qa" },
        "en",
        true,
      ),
    ).rejects.toMatchObject({
      init: { status: 403 },
      data: "You do not have permission to write to the ACL policy",
    });
    let original: string;
    try {
      original = (await api.policy.get()).policy;
    } catch (error) {
      // All supported releases report a missing database policy as gRPC
      // Unknown / HTTP 500, wrapped by our transport as HTTP 502.
      if (
        !isDataWithApiError(error) ||
        error.data.statusCode !== 500 ||
        error.data.data?.message !== "loading ACL from database: acl policy not found"
      )
        throw error;
      original = "{}";
    }
    const user = await api.users.create({ name: "hp-groups-action" });
    try {
      await api.policy.set(
        JSON.stringify({ hosts: { preserved: "10.0.0.1/32" }, groups: {}, acls: [] }),
      );
      for (const [locale, message] of [
        ["zh-CN", "用户组已成功更新"],
        ["en", "Groups updated successfully"],
      ] as const) {
        expect(
          await session.call(
            { action_id: "update_user_groups", user_name: user.name, groups: "group:qa" },
            locale,
          ),
        ).toEqual({ message });
        const policy = JSON.parse((await api.policy.get()).policy);
        expect(policy.groups["group:qa"]).toEqual([`${user.name}@`]);
        expect(policy.hosts.preserved).toBe("10.0.0.1/32");
      }
    } finally {
      await api.policy.set(original || "{}");
      await api.users.delete(user.id);
    }
  });
  test("users can be created", async () => {
    const client = await getRuntimeClient(version);
    const user = await client.users.create({ name: "tale@" });
    expect(user).toBeDefined();
    expect(user.name).toBe("tale@");
  });

  test("users can be created with attributes", async () => {
    const client = await getRuntimeClient(version);
    const user = await client.users.create({
      name: "test-user@",
      email: "test-user@example.com",
      displayName: "Test User",
      pictureUrl: "https://github.com/tale.png",
    });

    expect(user).toBeDefined();
    expect(user.name).toBe("test-user@");
    expect(user.email).toBe("test-user@example.com");
    expect(user.displayName).toBe("Test User");
    expect(user.profilePicUrl).toBe("https://github.com/tale.png");
  });

  test("users can be listed", async () => {
    const client = await getRuntimeClient(version);
    const users = await client.users.list();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(2);
  });

  test("users can be listed by name", async () => {
    const client = await getRuntimeClient(version);
    const users = await client.users.list({ name: "tale@" });
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("tale@");
  });

  test("users can be listed by email", async () => {
    const client = await getRuntimeClient(version);
    const users = await client.users.list({ email: "test-user@example.com" });
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("test-user@example.com");
  });

  test("users can be renamed", async () => {
    const client = await getRuntimeClient(version);
    const usersBefore = await client.users.list({ name: "tale@" });
    expect(usersBefore.length).toBe(1);
    const user = usersBefore[0];

    await client.users.rename(user.id, "renamed-user@");
    const usersAfter = await client.users.list({ name: "renamed-user@" });
    expect(usersAfter.length).toBe(1);
    expect(usersAfter[0].id).toBe(user.id);
  });

  test("users can be deleted", async () => {
    const client = await getRuntimeClient(version);
    const usersBefore = await client.users.list({ name: "test-user@" });
    expect(usersBefore.length).toBe(1);
    const user = usersBefore[0];

    await client.users.delete(user.id);
    const usersAfter = await client.users.list({ name: "test-user@" });
    expect(usersAfter.length).toBe(0);
  });
});
