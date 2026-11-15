import { RouterContextProvider } from "react-router";
import { describe, expect, test, vi } from "vitest";

import { setLocale } from "~/i18n/locale.server";
import { machineAction } from "~/routes/machines/machine-actions";
import { authContext, headscaleLiveStoreContext, requestApiContext } from "~/server/context";
import { isDataWithApiError } from "~/server/headscale/api/error-client";
import { Capabilities } from "~/server/web/roles";

import { getBootstrapClient, getNode, getRuntimeClient, HS_VERSIONS } from "../setup/env";

function registerRequest(registerKey: string) {
  const form = new FormData();
  form.set("action_id", "register");
  form.set("register_key", registerKey);
  form.set("user", "node-reg@");

  return new Request("http://headplane.test/machines", {
    method: "POST",
    body: form,
  });
}

function actionContext(api: Awaited<ReturnType<typeof getRuntimeClient>>) {
  const auth = { can: vi.fn(() => true), canManageNode: vi.fn(() => true) };
  const liveStore = { refresh: vi.fn() };
  const principal = { id: "integration-user" };
  const context = new RouterContextProvider();

  context.set(authContext, auth as never);
  context.set(headscaleLiveStoreContext, liveStore as never);
  context.set(requestApiContext, vi.fn(async () => ({ principal, api })) as never);

  return { auth, context, liveStore };
}

async function machineRequest(
  action: string,
  nodeId: string,
  fields: Record<string, string>,
  locale: "en" | "zh-CN",
) {
  return new Request("http://headplane.test/machines", {
    method: "POST",
    headers: {
      // The stored preference must win over a different browser language.
      Cookie: (await setLocale(locale)).split(";")[0],
      "Accept-Language": locale === "en" ? "zh-CN" : "en",
    },
    body: new URLSearchParams({ action_id: action, node_id: nodeId, ...fields }),
  });
}

describe.for(HS_VERSIONS)("Headscale %s: Users", { concurrent: false }, (version) => {
  let workingNodeId: string;

  test("nodes can register from a Tailscale registration URL", async () => {
    const client = await getRuntimeClient(version);
    const tailnetNode = await getNode(version);
    const { auth, context, liveStore } = actionContext(client);

    const user = await client.users.create({ name: "node-reg@" });
    expect(user.name).toBe("node-reg@");

    const response = await machineAction({
      request: registerRequest(tailnetNode.registerUrl),
      context,
      params: {},
    } as never);

    expect(auth.can).toHaveBeenCalledWith(expect.anything(), Capabilities.write_machines);
    expect(liveStore.refresh).toHaveBeenCalledOnce();
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);

    const nodes = await client.nodes.list();
    const node = nodes.find((n) => n.name === tailnetNode.nodeName);
    expect(node).toBeDefined();
    expect(node?.registerMethod).toBe("REGISTER_METHOD_CLI");
  });

  test("nodes can be retrieved", async () => {
    const client = await getRuntimeClient(version);
    const { nodeName } = await getNode(version);
    const nodes = await client.nodes.list();
    const node = nodes.find((n) => n.name === nodeName);
    expect(node).toBeDefined();
    expect(node?.name).toBe(nodeName);

    const fetchedNode = await client.nodes.get(node!.id);
    expect(fetchedNode).toBeDefined();
    expect(fetchedNode.id).toBe(node!.id);
    workingNodeId = node!.id;
  });

  test("nodes can be renamed", async () => {
    const client = await getRuntimeClient(version);
    const { nodeName } = await getNode(version);
    const { context } = actionContext(client);
    for (const [locale, message] of [
      ["en", "Machine renamed"],
      ["zh-CN", "设备已重命名"],
    ] as const) {
      const newName = `${nodeName}-renamed-${locale.toLowerCase()}`;
      const response = await machineAction({
        request: await machineRequest("rename", workingNodeId, { name: newName }, locale),
        context,
        params: {},
      } as never);
      expect(response).toEqual({ message });
      expect((await client.nodes.get(workingNodeId)).givenName).toBe(newName);
    }
  });

  test("localized validation and permission errors do not rename the device", async () => {
    const client = await getRuntimeClient(version);
    const before = await client.nodes.get(workingNodeId);
    const { context, auth, liveStore } = actionContext(client);
    for (const [locale, expected] of [
      ["en", "Machine names must be valid DNS labels"],
      ["zh-CN", "设备名称必须是有效的 DNS 标签"],
    ] as const) {
      await expect(
        machineAction({
          request: await machineRequest("rename", workingNodeId, { name: "invalid name!" }, locale),
          context,
          params: {},
        } as never),
      ).rejects.toMatchObject({ data: expect.stringContaining(expected), init: { status: 400 } });
    }
    auth.canManageNode.mockReturnValue(false);
    await expect(
      machineAction({
        request: await machineRequest("rename", workingNodeId, { name: "forbidden-name" }, "zh-CN"),
        context,
        params: {},
      } as never),
    ).rejects.toMatchObject({ data: "没有操作此设备的权限", init: { status: 403 } });
    expect(liveStore.refresh).not.toHaveBeenCalled();
    expect((await client.nodes.get(workingNodeId)).givenName).toBe(before.givenName);
  });

  test("translated tag failures preserve the actual Headscale diagnostic and HTTP status", async () => {
    const client = await getRuntimeClient(version);
    let original: string | undefined;
    try {
      await client.nodes.setTags(workingNodeId, ["invalid-without-tag-prefix"]);
      throw new Error("Headscale unexpectedly accepted an invalid tag");
    } catch (error) {
      if (!isDataWithApiError(error) || error.data.statusCode !== 400) throw error;
      const payload = error.data.data;
      original =
        payload && typeof payload === "object" && "message" in payload
          ? String(payload.message)
          : error.data.rawData;
    }
    expect(original).toBeTruthy();
    const { context } = actionContext(client);
    const response = await machineAction({
      request: await machineRequest(
        "update_tags",
        workingNodeId,
        { tags: "invalid-without-tag-prefix" },
        "zh-CN",
      ),
      context,
      params: {},
    } as never);
    expect(response).toMatchObject({ init: { status: 400 }, data: { success: false } });
    const message = (response as { data: { error: string } }).data.error;
    expect(message).toContain("Headscale 拒绝了标签更新（HTTP 400）");
    expect(message).toContain(original);
  });

  test("nodes can be reassigned to another user", async (context) => {
    const bootstrap = await getBootstrapClient(version);
    // Reassigning a node owner was removed in 0.28.
    if (bootstrap.capabilities.nodeOwnerIsImmutable) {
      context.skip();
    }

    const client = await getRuntimeClient(version);
    const user = await client.users.create({ name: "node-reassign@" });

    // reassignUser is only defined on pre-0.28 clients, hence the guard above.
    await client.nodes.reassignUser!(workingNodeId, user.id);
    const reassignedNode = await client.nodes.get(workingNodeId);
    expect(reassignedNode).toBeDefined();
    expect(reassignedNode.user?.name).toBe(user.name);
  });

  test("nodes can be expired", async () => {
    const client = await getRuntimeClient(version);
    await client.nodes.expire(workingNodeId);

    const expiredNode = await client.nodes.get(workingNodeId);
    expect(expiredNode).toBeDefined();
    expect(expiredNode.expiry).toBeDefined();
  });

  test("key expiry of nodes can be toggled", async (context) => {
    const bootstrap = await getBootstrapClient(version);
    // Key expiry was introduced in 0.29.0
    if (!bootstrap.capabilities.keyExpiryCanBeDisabled) {
      context.skip();
    }

    const client = await getRuntimeClient(version);
    const { context: actionCtx } = actionContext(client);
    const disabled = await machineAction({
      request: await machineRequest(
        "toggle_expiry",
        workingNodeId,
        { disableExpiry: "true" },
        "en",
      ),
      context: actionCtx,
      params: {},
    } as never);
    expect(disabled).toEqual({ message: "Key expiry disabled" });

    const permanentNode = await client.nodes.get(workingNodeId);
    expect(permanentNode).toBeDefined();
    expect(permanentNode.expiry).toBeNull();

    const enabled = await machineAction({
      request: await machineRequest(
        "toggle_expiry",
        workingNodeId,
        { disableExpiry: "false" },
        "zh-CN",
      ),
      context: actionCtx,
      params: {},
    } as never);
    expect(enabled).toEqual({ message: "已启用密钥过期" });

    const node = await client.nodes.get(workingNodeId);
    expect(node).toBeDefined();
    expect(node.expiry).not.toBeNull();
  });

  test("nodes can be deleted", async () => {
    const client = await getRuntimeClient(version);
    await client.nodes.delete(workingNodeId);

    const nodes = await client.nodes.list();
    const node = nodes.find((n) => n.id === workingNodeId);
    expect(node).toBeUndefined();
  });
});
