import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";

import { action, loader } from "~/routes/settings/auth-keys/overview";
import type { User } from "~/types";

import { createTailnet, type Tailnet } from "../../harness/tailnet";
import { statusOf, type TestApp } from "../../support/app";

// One Headscale for the file, so each test gets its own users and tags.
let tailnet: Tailnet;
let app: TestApp;
let alice: User;
let bob: User;
let tag: string;
let counter = 0;

beforeAll(async () => {
  tailnet = await createTailnet();
});

afterAll(async () => {
  await tailnet?.dispose();
});

beforeEach(async () => {
  counter += 1;
  app = await tailnet.headplane();
  alice = await tailnet.user(`alice${counter}@`);
  bob = await tailnet.user(`bob${counter}@`);
  tag = `tag:prod${counter}`;
});

async function tagOnlyKeys() {
  return (await app.api.preAuthKeys.listAll!()).filter((key) => key.aclTags.includes(tag));
}

function create(as: string, form: Record<string, string | string[]>, locale = "en") {
  return app.call(action, "/settings/auth-keys", {
    as,
    headers: { "Accept-Language": locale },
    form: { intent: "create", expiry: "90", ...form },
  });
}

function expire(as: string, form: Record<string, string>, locale = "en") {
  return app.call(action, "/settings/auth-keys", {
    as,
    headers: { "Accept-Language": locale },
    form: { intent: "expire", ...form },
  });
}

async function keysFor(user: User) {
  return app.api.preAuthKeys.listForUser(user.id);
}

describe("auth key expiry", () => {
  test("accepts a plain integer above the grouping threshold", async () => {
    const { cookie } = await app.signIn("admin");
    const result = await create(cookie, { user_id: alice.id, expiry: "365000" });

    expect(statusOf(result)).toBe(200);
    const [key] = await keysFor(alice);
    const days = Math.round((new Date(key.expiration).getTime() - Date.now()) / 86_400_000);
    expect(days).toBe(365_000);
  });

  // Values >= 1000 used to be submitted through Intl.NumberFormat, which groups
  // digits differently per locale. Leniently parsing those either produced an
  // Invalid Date (500) or, for dot-grouping locales, a silently wrong expiry.
  test.for(["365,000", "365 000", "365 000", "365.000", "0", "-1", "", "90 days", "9999999999999"])(
    "rejects %j",
    async (expiry) => {
      const { cookie } = await app.signIn("admin");
      const result = await create(cookie, { user_id: alice.id, expiry });

      expect(statusOf(result)).toBe(400);
      expect(await keysFor(alice)).toEqual([]);
    },
  );
});

describe("self-service auth keys", () => {
  async function signInAsAlice() {
    const session = await app.signIn("viewer");
    await app.ctx.auth.linkHeadscaleUser(session.userId, alice.id);
    return session.cookie;
  }

  test("a viewer can create a key for their own user", async () => {
    const cookie = await signInAsAlice();

    expect(statusOf(await create(cookie, { user_id: alice.id }))).toBe(200);
    expect(await keysFor(alice)).toHaveLength(1);
  });

  test("Chinese auth key actions preserve expiry and ownership boundaries against Headscale", async () => {
    const { cookie: admin } = await app.signIn("admin");
    const created = await create(
      admin,
      { user_id: bob.id, expiry: " 1000 ", reusable: "on", ephemeral: "on", tags: ` ${tag} ` },
      "zh-CN",
    );
    expect(statusOf(created)).toBe(200);
    const [key] = await keysFor(bob);
    expect(key).toMatchObject({ reusable: true, ephemeral: true, aclTags: [tag] });
    expect(Math.round((new Date(key.expiration).getTime() - Date.now()) / 86_400_000)).toBe(1000);
    // Creation must return a usable key; don't log it in a failed assertion.
    if (!created || typeof created !== "object" || !("data" in created))
      throw new Error("Key creation did not return a secret");
    const secret = created.data as { key?: string };
    expect(typeof secret.key === "string" && secret.key.length > 0).toBe(true);

    const viewer = await signInAsAlice();
    const forbidden = await create(viewer, { user_id: bob.id }, "zh-CN");
    expect(statusOf(forbidden)).toBe(403);
    expect(forbidden).toMatchObject({ data: { errors: { form: "只能管理自己的认证密钥。" } } });
    const wrongOwner = await expire(viewer, { user_id: alice.id, key_id: key.id }, "zh-CN");
    expect(statusOf(wrongOwner)).toBe(404);
    expect(wrongOwner).toMatchObject({ data: { errors: { form: "此认证密钥已不存在。" } } });
    expect((await keysFor(bob))[0].expiration).toBe(key.expiration);
    expect(await expire(admin, { user_id: bob.id, key_id: key.id }, "zh-CN")).toMatchObject({
      ok: true,
      message: "认证密钥已过期",
    });
    expect(new Date((await keysFor(bob))[0].expiration).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test("a viewer can't create a key for someone else", async () => {
    const cookie = await signInAsAlice();

    expect(statusOf(await create(cookie, { user_id: bob.id }))).toBe(403);
    expect(await keysFor(bob)).toEqual([]);
  });

  test("a viewer can't create a tag-only key", async () => {
    const cookie = await signInAsAlice();

    expect(statusOf(await create(cookie, { tags: tag }))).toBe(403);
    expect(await tagOnlyKeys()).toEqual([]);
  });

  test("a viewer can expire their own key", async () => {
    const cookie = await signInAsAlice();
    await create(cookie, { user_id: alice.id });
    const [key] = await keysFor(alice);

    expect(statusOf(await expire(cookie, { key_id: key.id, user_id: alice.id }))).toBe(200);
    const [expired] = await keysFor(alice);
    expect(new Date(expired.expiration).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test("a viewer can't expire someone else's key by naming their own user", async () => {
    const { cookie: admin } = await app.signIn("admin");
    await create(admin, { user_id: bob.id });
    const [key] = await keysFor(bob);

    const cookie = await signInAsAlice();
    expect(statusOf(await expire(cookie, { key_id: key.id, user_id: alice.id }))).toBe(404);
    expect((await keysFor(bob))[0].expiration).toBe(key.expiration);
  });

  test("a viewer only sees their own user and keys", async () => {
    const { cookie: admin } = await app.signIn("admin");
    await create(admin, { user_id: alice.id });
    await create(admin, { user_id: bob.id });
    await create(admin, { tags: tag });

    const data = (await app.call(loader, "/settings/auth-keys", {
      as: await signInAsAlice(),
    })) as Awaited<ReturnType<typeof loader>>;

    expect(data.users.map((user) => user.id)).toEqual([alice.id]);
    expect(data.keys.map(({ user }) => user?.id)).toEqual([alice.id]);
  });

  test("an admin sees every user's keys and the tag-only ones", async () => {
    const { cookie } = await app.signIn("admin");
    await create(cookie, { user_id: alice.id });
    await create(cookie, { user_id: bob.id });
    await create(cookie, { tags: tag });

    const data = (await app.call(loader, "/settings/auth-keys", {
      as: cookie,
    })) as Awaited<ReturnType<typeof loader>>;

    const owners = data.keys.map(({ user }) => user?.id ?? null);
    expect(owners).toEqual(expect.arrayContaining([null, alice.id, bob.id]));

    const tagOnly = data.keys.find(({ user }) => user === null)!.preAuthKeys;
    expect(tagOnly.filter((key) => key.aclTags.includes(tag))).toHaveLength(1);
  });
});
