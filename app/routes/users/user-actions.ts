import type { ActionFunctionArgs } from "react-router";
import * as v from "valibot";

import type { Locale } from "~/i18n/locale";
import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import { authContext, headscaleLiveStoreContext, requestApiContext } from "~/server/context";
import type { HeadscaleClient } from "~/server/headscale/api";
import { isDataWithApiError } from "~/server/headscale/api/error-client";
import { usersResource } from "~/server/headscale/live-store";
import { ActionError, createAction } from "~/server/web/actions";
import { type AuthService, isUserPrincipal } from "~/server/web/auth";
import { Capabilities, Roles, type Role } from "~/server/web/roles";
import { isValidGroupName, parsePolicy, serializePolicy, setUserGroups } from "~/utils/acl-policy";
import { invalid, list, ok } from "~/utils/form";

import { usernameSchema } from "./schemas";

function createUserAction(locale: Locale) {
  const t = createTranslator(locale);
  const id = v.pipe(v.string(t("users.validation.id")), v.minLength(1, t("users.validation.id")));
  const username = usernameSchema(locale);
  const optionalText = v.pipe(
    v.optional(v.string(t("users.validation.text")), ""),
    v.trim(),
    v.transform((value) => value || undefined),
  );

  const assignableRoles = Object.keys(Roles).filter((role) => role !== "owner") as Exclude<
    Role,
    "owner"
  >[];

  return createAction({
    locale,
    validationMessage: t("validation.required"),
    capability: Capabilities.write_users,
    async setup({ request, context }) {
      const { principal, api } = await context.get(requestApiContext)(request);
      const liveStore = context.get(headscaleLiveStoreContext);

      return {
        principal,
        api,
        auth: context.get(authContext),
        refresh: () => liveStore.refresh(usersResource, api),
      };
    },
    intents: {
      create: {
        fields: { name: username, display_name: optionalText, email: optionalText },
        async handler(input, { api, refresh }) {
          await requireFreeName(api, input.name);
          await api.users.create({
            name: input.name,
            displayName: input.display_name,
            email: input.email,
          });
          await refresh();
          return ok(t("users.success.created"));
        },
      },
      delete: {
        fields: { headscale_user_id: id },
        async handler(input, { api, auth, refresh }) {
          await api.users.delete(input.headscale_user_id);
          for (const user of await auth.listUsers()) {
            if (user.headscale_user_id === input.headscale_user_id) {
              await auth.unlinkHeadscaleUser(user.id);
            }
          }

          await refresh();
          return ok(t("users.success.deleted"));
        },
      },
      rename: {
        fields: { headscale_user_id: id, name: username },
        async handler(input, { api, refresh }) {
          const users = await api.users.list({ id: input.headscale_user_id });
          const user = users.find((user) => user.id === input.headscale_user_id);
          if (!user) {
            throw new ActionError(t("users.error.notFound"), 404);
          }

          if (user.provider === "oidc") {
            throw new ActionError(t("users.error.oidcRename"), 403);
          }

          await requireFreeName(api, input.name);
          await api.users.rename(user.id, input.name);
          await refresh();
          return ok(t("users.success.renamed"));
        },
      },
      reassign: {
        fields: {
          headplane_user_id: id,
          role: v.picklist(assignableRoles, t("users.validation.role")),
        },
        async handler(input, { auth }) {
          const user = await requireHeadplaneUser(auth, input.headplane_user_id);
          if (user.role === "owner") {
            throw new ActionError(t("users.error.ownerRole"), 403);
          }

          if (!(await auth.reassignUser(user.id, input.role))) {
            throw new ActionError(t("users.error.reassign"), 500);
          }

          return ok(t("users.success.roleChanged"));
        },
      },
      transfer: {
        fields: { headplane_user_id: id },
        async handler(input, { auth, principal }) {
          if (!isUserPrincipal(principal) || principal.user.role !== "owner") {
            throw new ActionError(t("users.error.ownerOnly"), 403);
          }

          const target = await requireHeadplaneUser(auth, input.headplane_user_id);
          if (target.id === principal.user.id) {
            throw new ActionError(t("users.error.alreadyOwner"));
          }

          if (!(await auth.transferOwnership(principal.user.id, input.headplane_user_id))) {
            throw new ActionError(t("users.error.transfer"), 500);
          }

          return ok(t("users.success.transferred"));
        },
      },
      link: {
        fields: {
          headplane_user_id: id,
          headscale_user_id: v.pipe(
            v.string(t("users.validation.headscaleUser")),
            v.minLength(1, t("users.validation.headscaleUser")),
          ),
        },
        async handler(input, { api, auth }) {
          const user = await requireHeadplaneUser(auth, input.headplane_user_id);
          const [headscaleUser] = await api.users.list({ id: input.headscale_user_id });
          if (headscaleUser?.id !== input.headscale_user_id) {
            throw new ActionError(t("users.error.headscaleNotFound"), 404);
          }

          if (!(await auth.linkHeadscaleUser(user.id, headscaleUser.id))) {
            throw new ActionError(t("users.error.claimed"), 409);
          }

          return ok(t("users.success.linked"));
        },
      },
      update_groups: {
        // Group membership lives in the policy, so `write_policy` is needed too.
        capability: Capabilities.write_policy,
        fields: {
          user_name: id,
          groups: list(v.string(t("users.validation.text")), t("users.validation.text")),
        },
        async handler(input, { api }) {
          const groups = input.groups.map((group) => group.trim()).filter((group) => group !== "");
          const invalidGroups = groups.filter((group) => !isValidGroupName(group));
          if (invalidGroups.length > 0) {
            return invalid({
              form: t("users.error.invalidGroups", { groups: invalidGroups.join(", ") }),
            });
          }

          const { policy } = await api.policy.get();
          const parsed = parsePolicy(policy);
          if (!parsed.ok) {
            throw new ActionError(t("users.error.policyParse", { error: parsed.error }));
          }

          try {
            await api.policy.set(
              serializePolicy(setUserGroups(parsed.policy, input.user_name, groups)),
            );
          } catch (error) {
            // Headscale refuses policy writes in `file` mode. The UI hides group
            // editing then, but a stale page can still get here.
            if (isDataWithApiError(error) && error.data.rawData.includes("update is disabled")) {
              throw new ActionError(t("users.error.policyReadOnly"), 403);
            }

            throw error;
          }

          return ok(t("users.success.groupsUpdated"));
        },
      },
    },
  });

  async function requireFreeName(api: HeadscaleClient, name: string) {
    const [existing] = await api.users.list({ name });
    if (existing?.name === name) {
      throw new ActionError(t("users.error.duplicateName", { name }), 409);
    }
  }

  async function requireHeadplaneUser(auth: AuthService, id: string) {
    const user = (await auth.listUsers()).find((user) => user.id === id);
    if (!user) {
      throw new ActionError(t("users.error.notFound"), 404);
    }

    return user;
  }
}

const localizedActions = {
  en: createUserAction("en"),
  "zh-CN": createUserAction("zh-CN"),
};

export const userAction = Object.assign(
  async (args: ActionFunctionArgs) => localizedActions[await getLocale(args.request)](args),
  { intents: localizedActions.en.intents },
);
