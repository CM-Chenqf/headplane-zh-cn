import type { ActionFunctionArgs } from "react-router";
import * as v from "valibot";

import type { Locale } from "~/i18n/locale";
import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import {
  authContext,
  headscaleConfigContext,
  headscaleContext,
  integrationContext,
} from "~/server/context";
import { ActionError, createAction } from "~/server/web/actions";
import { Capabilities } from "~/server/web/roles";
import { invalid, ok, parseValues } from "~/utils/form";

import { moveItem } from "./reorder";
import { dnsSchemas } from "./schemas";

const text = (message: string) => v.pipe(v.string(message), v.trim(), v.nonEmpty(message));

function nameserverPath(split?: string) {
  return split ? `dns.nameservers.split."${split}"` : "dns.nameservers.global";
}

function createDnsAction(locale: Locale) {
  const t = createTranslator(locale);
  const { nameserver, recordValue } = dnsSchemas(locale);
  const toggle = v.picklist(["true", "false"], t("dns.validation.toggle"));
  // Empty means the global nameservers rather than a split DNS domain.
  const splitDomain = v.pipe(
    v.optional(v.string(t("dns.validation.domain")), ""),
    v.trim(),
    v.transform((value) => value || undefined),
  );
  return createAction({
    locale,
    validationMessage: t("validation.required"),
    capability: Capabilities.write_network,
    async setup({ request, context }) {
      const principal = await context.get(authContext).require(request);
      const headscale = context.get(headscaleContext);
      const config = context.get(headscaleConfigContext);
      const integration = context.get(integrationContext);
      if (!config.writable()) {
        throw new ActionError(t("dns.error.readOnly"), 403);
      }

      return {
        principal,
        config,
        dns: config.getDNSConfig(),
        restart: async () => {
          if (integration && !(await integration.onConfigChange(headscale))) {
            throw new ActionError(t("dns.error.restart"), 502);
          }
        },
      };
    },
    intents: {
      rename_tailnet: {
        fields: { name: text(t("dns.validation.tailnet")) },
        async handler(input, { config, restart }) {
          await config.patch([{ path: "dns.base_domain", value: input.name }]);
          await restart();
          return ok(t("dns.success.renamed"));
        },
      },
      toggle_magic: {
        fields: { enabled: toggle },
        async handler(input, { config, restart }) {
          const isEnabled = input.enabled === "true";
          await config.patch([{ path: "dns.magic_dns", value: isEnabled }]);
          await restart();
          return ok(t(isEnabled ? "dns.success.magicEnabled" : "dns.success.magicDisabled"));
        },
      },
      override_dns: {
        fields: { enabled: toggle },
        async handler(input, { config, dns, restart }) {
          const isEnabled = input.enabled === "true";
          // Headscale won't start overriding local DNS without a global nameserver.
          if (isEnabled && dns.nameservers.length === 0) {
            throw new ActionError(t("dns.error.overrideNeedsNameserver"));
          }

          await config.patch([{ path: "dns.override_local_dns", value: isEnabled }]);
          await restart();
          return ok(t("dns.success.override"));
        },
      },
      add_ns: {
        fields: { nameserver, split_domain: splitDomain },
        async handler(input, { config, dns, restart }) {
          const servers = input.split_domain
            ? (dns.splitDns[input.split_domain] ?? [])
            : dns.nameservers;
          if (servers.includes(input.nameserver)) {
            return invalid({ nameserver: t("dns.error.duplicateNameserver") });
          }

          await config.patch([
            { path: nameserverPath(input.split_domain), value: [...servers, input.nameserver] },
          ]);
          await restart();
          return ok(t("dns.success.nameserverAdded"));
        },
      },
      remove_ns: {
        fields: { nameserver: v.string(t("validation.required")), split_domain: splitDomain },
        async handler(input, { config, dns, restart }) {
          const current = input.split_domain
            ? (dns.splitDns[input.split_domain] ?? [])
            : dns.nameservers;
          if (!current.includes(input.nameserver)) {
            throw new ActionError(t("dns.error.missingNameserver"));
          }

          const servers = current.filter((server) => server !== input.nameserver);

          if (!input.split_domain && servers.length === 0 && dns.overrideDns) {
            throw new ActionError(t("dns.error.lastNameserver"));
          }

          // An empty split list is dropped so Headscale doesn't keep the domain.
          await config.patch([
            {
              path: nameserverPath(input.split_domain),
              value: input.split_domain && servers.length === 0 ? null : servers,
            },
          ]);
          await restart();
          return ok(t("dns.success.nameserverRemoved"));
        },
      },
      move_ns: {
        fields: {
          nameserver: v.string(t("validation.required")),
          split_domain: splitDomain,
          direction: v.picklist(["up", "down"], t("dns.validation.direction")),
        },
        async handler(input, { config, dns, restart }) {
          const servers = input.split_domain
            ? (dns.splitDns[input.split_domain] ?? [])
            : dns.nameservers;
          if (!servers.includes(input.nameserver)) {
            throw new ActionError(t("dns.error.missingNameserver"));
          }

          // moveItem hands back the same list when there's nowhere to move.
          const moved = moveItem(servers, input.nameserver, input.direction);
          if (moved === servers) {
            throw new ActionError(
              t(
                input.direction === "up" ? "dns.error.nameserverTop" : "dns.error.nameserverBottom",
              ),
            );
          }

          await config.patch([{ path: nameserverPath(input.split_domain), value: moved }]);
          await restart();
          return ok();
        },
      },
      add_domain: {
        fields: { domain: text(t("dns.validation.search")) },
        async handler(input, { config, dns, restart }) {
          if (dns.searchDomains.includes(input.domain)) {
            return invalid({ domain: t("dns.error.duplicateDomain") });
          }

          await config.patch([
            { path: "dns.search_domains", value: [...dns.searchDomains, input.domain] },
          ]);
          await restart();
          return ok(t("dns.success.domainAdded"));
        },
      },
      remove_domain: {
        fields: { domain: v.string(t("validation.required")) },
        async handler(input, { config, dns, restart }) {
          if (!dns.searchDomains.includes(input.domain)) {
            throw new ActionError(t("dns.error.missingDomain"));
          }

          await config.patch([
            {
              path: "dns.search_domains",
              value: dns.searchDomains.filter((domain) => domain !== input.domain),
            },
          ]);
          await restart();
          return ok(t("dns.success.domainRemoved"));
        },
      },
      move_domain: {
        fields: {
          domain: v.string(t("validation.required")),
          direction: v.picklist(["up", "down"], t("dns.validation.direction")),
        },
        async handler(input, { config, dns, restart }) {
          if (!dns.searchDomains.includes(input.domain)) {
            throw new ActionError(t("dns.error.missingDomain"));
          }

          const moved = moveItem(dns.searchDomains, input.domain, input.direction);
          if (moved === dns.searchDomains) {
            throw new ActionError(
              t(input.direction === "up" ? "dns.error.domainTop" : "dns.error.domainBottom"),
            );
          }

          await config.patch([{ path: "dns.search_domains", value: moved }]);
          await restart();
          return ok();
        },
      },
      add_record: {
        fields: {
          type: v.picklist(["A", "AAAA"], t("dns.validation.type")),
          name: text(t("dns.validation.domain")),
          value: v.string(t("validation.required")),
        },
        async handler(input, { config, dns }) {
          if (!config.recordsWritable()) {
            throw new ActionError(t("dns.error.recordsReadOnly"), 403);
          }

          const value = parseValues(recordValue[input.type], input.value);
          if (!value.ok) {
            return invalid({ value: value.errors.form });
          }

          if (dns.extraRecords.some((r) => r.name === input.name && r.type === input.type)) {
            return invalid({ name: t("dns.error.duplicateRecord", { type: input.type }) });
          }

          await config.addDNS({ name: input.name, type: input.type, value: value.data });
          return ok(t("dns.success.recordAdded"));
        },
      },
      remove_record: {
        fields: {
          type: v.string(t("validation.required")),
          name: v.string(t("validation.required")),
        },
        async handler(input, { config, dns }) {
          if (!config.recordsWritable()) {
            throw new ActionError(t("dns.error.recordsReadOnly"), 403);
          }

          if (!dns.extraRecords.some((r) => r.name === input.name && r.type === input.type)) {
            throw new ActionError(t("dns.error.missingRecord"));
          }

          await config.removeDNS({ name: input.name, type: input.type, value: "" });
          return ok(t("dns.success.recordRemoved"));
        },
      },
    },
  });
}

const localizedActions = {
  en: createDnsAction("en"),
  "zh-CN": createDnsAction("zh-CN"),
};

export const dnsAction = Object.assign(
  async (args: ActionFunctionArgs) => localizedActions[await getLocale(args.request)](args),
  { intents: localizedActions.en.intents },
);
