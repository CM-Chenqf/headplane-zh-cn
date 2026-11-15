import { readFile } from "node:fs/promises";

import { RouterContextProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import { setLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import { dnsAction } from "~/routes/dns/dns-actions";
import { authKeysAction } from "~/routes/settings/auth-keys/actions";
import { restrictionAction } from "~/routes/settings/restrictions/actions";
import {
  authContext,
  headscaleConfigContext,
  headscaleContext,
  integrationContext,
  requestApiContext,
} from "~/server/context";
import { loadHeadscaleConfig } from "~/server/headscale/config-loader";

import { tempFile } from "../../support/temp";
import { createTestAuth } from "../../unit/auth/create-auth";
import { getBootstrapClient, getRuntimeClient, HS_VERSIONS } from "../setup/env";

describe.for(HS_VERSIONS)(
  "Headscale %s: bilingual settings and DNS",
  { concurrent: false },
  (version) => {
    test("preserves raw form values, config fields and permission boundaries in either locale", async () => {
      const api = await getRuntimeClient(version);
      const bootstrap = await getBootstrapClient(version);
      const { auth } = createTestAuth();
      const owner = await auth.findOrCreateUser("settings-owner");
      const member = await auth.findOrCreateUser("settings-member");
      const cookies = await Promise.all(
        [owner, member].map(
          async (id) => (await auth.createOidcSession(id, { name: "Settings test" })).split(";")[0],
        ),
      );
      const context = new RouterContextProvider();
      context.set(authContext, auth);
      context.set(headscaleContext, bootstrap);
      context.set(integrationContext, undefined);
      context.set(requestApiContext, async (request) => ({
        principal: await auth.require(request),
        api,
      }));
      const file = await tempFile(
        "headscale.yaml",
        "server_url: http://localhost:8080\nfuture_setting: keep-me\ndns:\n  base_domain: example.net\n  magic_dns: true\n  nameservers:\n    global: []\n  search_domains: []\noidc:\n  issuer: https://idp.example.net\n  allowed_domains: []\n  allowed_groups: []\n  allowed_users: []\n",
      );
      context.set(headscaleConfigContext, await loadHeadscaleConfig(file));
      const user = await api.users.create({
        name: `i18nsettings${crypto.randomUUID().slice(0, 8)}`,
      });
      async function args(
        fields: Record<string, string>,
        locale: "en" | "zh-CN",
        asMember = false,
      ) {
        return {
          request: new Request("http://headplane.test/settings", {
            method: "POST",
            headers: {
              Cookie: `${cookies[asMember ? 1 : 0]}; ${(await setLocale(locale)).split(";")[0]}`,
              "Accept-Language": locale === "en" ? "zh-CN" : "en",
            },
            body: new URLSearchParams(fields),
          }),
          context,
          params: {},
        } as never;
      }
      try {
        for (const locale of ["en", "zh-CN"] as const) {
          const t = createTranslator(locale);
          const preauth = {
            action_id: "add_preauthkey",
            user_id: user.id,
            acl_tags: "",
            reusable: "off",
            ephemeral: "on",
            expiry: "365000",
          };
          await expect(authKeysAction(await args(preauth, locale, true))).rejects.toMatchObject({
            init: { status: 403 },
            data: t("authKeys.error.permission"),
          });
          for (const expiry of [
            "365,000",
            "365 000",
            "365 000",
            "365.000",
            "0",
            "-1",
            "90 days",
            "9999999999999",
          ]) {
            const bad = await authKeysAction(await args({ ...preauth, expiry }, locale));
            expect(bad).toMatchObject({ init: { status: 400 }, data: t("authKeys.error.days") });
          }
          const created = await authKeysAction(await args(preauth, locale));
          expect(created.data).toMatchObject({ success: true });
          const keys = await api.preAuthKeys.listForUser(user.id);
          const key = keys.find(
            (key) => typeof created.data === "object" && key.key === created.data.key,
          );
          if (!key) throw new Error("Headscale did not retain the generated key");
          expect(key.ephemeral).toBe(true);
          expect(key.reusable).toBe(false);
          expect(Math.round((new Date(key.expiration).getTime() - Date.now()) / 86_400_000)).toBe(
            365000,
          );
          await authKeysAction(
            await args(
              { action_id: "expire_preauthkey", user_id: user.id, key_id: key.id, key: key.key },
              locale,
            ),
          );
          const expired = (await api.preAuthKeys.listForUser(user.id)).find(
            (k) => k.key === key.key,
          );
          expect(new Date(expired!.expiration).getTime()).toBeLessThanOrEqual(Date.now());
          const dns = { action_id: "add_ns", ns: "1.1.1.1", split_name: "corp.example.net" };
          expect(await dnsAction(await args(dns, locale, true))).toMatchObject({
            init: { status: 403 },
          });
          expect(await dnsAction(await args(dns, locale))).toEqual({
            message: t("dns.success.nsAdded"),
          });
          await dnsAction(
            await args({ action_id: "rename_tailnet", new_name: "tail.example.net" }, locale),
          );
          const restriction = { action_id: "add_group", group: "  ops-team  " };
          await expect(
            restrictionAction(await args(restriction, locale, true)),
          ).rejects.toMatchObject({ init: { status: 403 }, data: t("restrictions.error.write") });
          expect(await restrictionAction(await args(restriction, locale))).toMatchObject({
            data: t("restrictions.group.added"),
          });
          const config = parse(await readFile(file, "utf8"));
          expect(config.future_setting).toBe("keep-me");
          expect(config.dns.base_domain).toBe("tail.example.net");
          expect(config.dns.nameservers.split["corp.example.net"]).toContain("1.1.1.1");
          expect(config.oidc.allowed_groups).toEqual(["ops-team"]);
          await restrictionAction(
            await args({ action_id: "remove_group", group: "ops-team" }, locale),
          );
        }
      } finally {
        await api.users.delete(user.id);
      }
    });
  },
);
