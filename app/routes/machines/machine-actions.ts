import { type ActionFunctionArgs, redirect } from "react-router";
import * as v from "valibot";

import type { Locale } from "~/i18n/locale";
import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import {
  authContext,
  headscaleContext,
  headscaleLiveStoreContext,
  requestApiContext,
} from "~/server/context";
import { isDataWithApiError } from "~/server/headscale/api/error-client";
import { nodesResource } from "~/server/headscale/live-store";
import { ActionError, createAction } from "~/server/web/actions";
import { Capabilities } from "~/server/web/roles";
import { invalid, list, ok } from "~/utils/form";
import { normalizeRegistrationKey } from "~/utils/register-key";

import { machineNameSchema } from "./schemas";

function createMachineAction(locale: Locale) {
  const t = createTranslator(locale);
  const nodeId = v.pipe(
    v.string(t("machines.validation.id")),
    v.minLength(1, t("machines.validation.id")),
  );
  const toggle = v.picklist(["true", "false"], t("machines.validation.toggle"));
  const textList = () =>
    list(v.string(t("machines.validation.text")), t("machines.validation.text"));

  return createAction({
    locale,
    async setup({ request, context }) {
      const { principal, api } = await context.get(requestApiContext)(request);
      const auth = context.get(authContext);
      const liveStore = context.get(headscaleLiveStoreContext);
      const { capabilities } = context.get(headscaleContext);

      async function requireNode(id: string) {
        const node = await api.nodes.get(id).catch((error: unknown) => {
          if (isDataWithApiError(error) && error.data.statusCode === 404) {
            throw new ActionError(t("machines.error.notFound"), 404);
          }

          throw error;
        });

        if (!auth.canManageNode(principal, node)) {
          throw new ActionError(t("machines.error.forbidden"), 403);
        }

        return node;
      }

      return {
        principal,
        api,
        capabilities,
        requireNode,
        refresh: () => liveStore.refresh(nodesResource, api),
      };
    },
    intents: {
      register: {
        capability: Capabilities.write_machines,
        fields: {
          register_key: v.pipe(
            v.string(t("machines.validation.keyRequired")),
            v.minLength(1, t("machines.validation.keyRequired")),
          ),
          user: v.pipe(
            v.string(t("machines.validation.owner")),
            v.minLength(1, t("machines.validation.owner")),
          ),
        },
        async handler(input, { api, refresh }) {
          const registrationKey = normalizeRegistrationKey(input.register_key);
          if (!registrationKey) {
            return invalid({
              register_key: t("machines.validation.registrationCommand"),
            });
          }

          const node = await api.nodes.register(input.user, registrationKey);
          await refresh();
          return redirect(`/machines/${node.id}`);
        },
      },
      rename: {
        fields: { node_id: nodeId, name: machineNameSchema(locale) },
        async handler(input, { api, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          await api.nodes.rename(node.id, input.name);
          await refresh();
          return ok(t("machines.success.renamed"));
        },
      },
      delete: {
        fields: { node_id: nodeId },
        async handler(input, { api, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          await api.nodes.delete(node.id);
          await refresh();
          return redirect("/machines");
        },
      },
      expire: {
        fields: { node_id: nodeId },
        async handler(input, { api, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          await api.nodes.expire(node.id);
          await refresh();
          return ok(t("machines.success.expired"));
        },
      },
      toggle_expiry: {
        fields: { node_id: nodeId, disable_expiry: toggle },
        async handler(input, { api, capabilities, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          const disableExpiry = input.disable_expiry === "true";

          // Older versions take this as a request to expire the machine now.
          if (disableExpiry && !capabilities.keyExpiryCanBeDisabled) {
            throw new ActionError(t("machines.error.expiryVersion"));
          }

          await api.nodes.toggleExpiry(node.id, disableExpiry);
          await refresh();
          return ok(
            t(disableExpiry ? "machines.success.expiryDisabled" : "machines.success.expiryEnabled"),
          );
        },
      },
      update_tags: {
        fields: { node_id: nodeId, tags: textList() },
        async handler(input, { api, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          const tags = input.tags.map((tag) => tag.trim()).filter((tag) => tag !== "");
          await api.nodes.setTags(node.id, tags);
          await refresh();
          return ok(t("machines.success.tags"));
        },
      },
      update_routes: {
        fields: { node_id: nodeId, routes: textList(), enabled: toggle },
        async handler(input, { api, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          const routes = input.routes.map((route) => route.trim()).filter((route) => route !== "");
          const approved =
            input.enabled === "true"
              ? [...new Set([...node.approvedRoutes, ...routes])]
              : node.approvedRoutes.filter((route) => !routes.includes(route));

          await api.nodes.approveRoutes(node.id, approved);
          await refresh();
          return ok(t("machines.success.routes"));
        },
      },
      reassign: {
        fields: {
          node_id: nodeId,
          user_id: v.pipe(
            v.string(t("machines.validation.owner")),
            v.minLength(1, t("machines.validation.owner")),
          ),
        },
        async handler(input, { api, requireNode, refresh }) {
          const node = await requireNode(input.node_id);
          if (!api.nodes.reassignUser) {
            throw new ActionError(t("machines.error.ownerVersion"));
          }

          await api.nodes.reassignUser(node.id, input.user_id);
          await refresh();
          return ok(t("machines.success.owner"));
        },
      },
    },
  });
}

// Immutable handlers per language keep schemas and responses isolated between
// concurrent requests. The harness still sees the original intent list.
const localizedActions = { en: createMachineAction("en"), "zh-CN": createMachineAction("zh-CN") };
export const machineAction = Object.assign(
  async (args: ActionFunctionArgs) => localizedActions[await getLocale(args.request)](args),
  { intents: localizedActions.en.intents },
);
