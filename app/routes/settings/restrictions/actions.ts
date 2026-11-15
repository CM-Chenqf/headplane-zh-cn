import { data } from "react-router";

import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import {
  authContext,
  headscaleConfigContext,
  headscaleContext,
  integrationContext,
} from "~/server/context";
import { Capabilities } from "~/server/web/roles";

import type { Route } from "./+types/overview";

export async function restrictionAction({ request, context }: Route.ActionArgs) {
  const t = createTranslator(await getLocale(request));
  const auth = context.get(authContext);
  const headscale = context.get(headscaleContext);
  const headscaleConfig = context.get(headscaleConfigContext);
  const integration = context.get(integrationContext);

  const principal = await auth.require(request);
  const check = auth.can(principal, Capabilities.configure_iam);

  if (!check) {
    throw data(t("restrictions.error.write"), {
      status: 403,
    });
  }

  if (!headscaleConfig.writable()) {
    throw data(t("restrictions.error.readOnly"), {
      status: 403,
    });
  }

  const formData = await request.formData();
  const action = formData.get("action_id")?.toString();
  if (!action) {
    throw data(t("restrictions.error.action"), {
      status: 400,
    });
  }

  switch (action) {
    case "add_domain": {
      const domain = formData.get("domain")?.toString()?.trim();
      if (!domain) {
        throw data(t("restrictions.domain.required"), {
          status: 400,
        });
      }

      const domains = [
        ...new Set([...(headscaleConfig.getOIDCConfig()?.allowedDomains ?? []), domain]),
      ];

      await headscaleConfig.patch([
        {
          path: "oidc.allowed_domains",
          value: domains,
        },
      ]);

      integration?.onConfigChange(headscale);
      return data(t("restrictions.domain.added"));
    }

    case "remove_domain": {
      const domain = formData.get("domain")?.toString()?.trim();
      if (!domain) {
        throw data(t("restrictions.domain.required"), {
          status: 400,
        });
      }

      const storedDomains = headscaleConfig.getOIDCConfig()?.allowedDomains ?? [];
      if (!storedDomains.includes(domain)) {
        // Domain not found in the list
        throw data(t("restrictions.domain.missing", { value: domain }), {
          status: 400,
        });
      }

      // Filter out the domain to remove it from the list
      const domains = storedDomains.filter((d: string) => d !== domain);
      await headscaleConfig.patch([
        {
          path: "oidc.allowed_domains",
          value: domains,
        },
      ]);
      integration?.onConfigChange(headscale);
      return data(t("restrictions.domain.removed"));
    }

    case "add_group": {
      const group = formData.get("group")?.toString()?.trim();
      if (!group) {
        throw data(t("restrictions.group.required"), {
          status: 400,
        });
      }

      const groups = [
        ...new Set([...(headscaleConfig.getOIDCConfig()?.allowedGroups ?? []), group]),
      ];

      await headscaleConfig.patch([
        {
          path: "oidc.allowed_groups",
          value: groups,
        },
      ]);

      integration?.onConfigChange(headscale);
      return data(t("restrictions.group.added"));
    }

    case "remove_group": {
      const group = formData.get("group")?.toString()?.trim();
      if (!group) {
        throw data(t("restrictions.group.required"), {
          status: 400,
        });
      }

      const storedGroups = headscaleConfig.getOIDCConfig()?.allowedGroups ?? [];
      if (!storedGroups.includes(group)) {
        // Group not found in the list
        throw data(t("restrictions.group.missing", { value: group }), {
          status: 400,
        });
      }

      // Filter out the group to remove it from the list
      const groups = storedGroups.filter((d: string) => d !== group);
      await headscaleConfig.patch([
        {
          path: "oidc.allowed_groups",
          value: groups,
        },
      ]);

      integration?.onConfigChange(headscale);
      return data(t("restrictions.group.removed"));
    }

    case "add_user": {
      const user = formData.get("user")?.toString()?.trim();
      if (!user) {
        throw data(t("restrictions.user.required"), {
          status: 400,
        });
      }

      const users = [...new Set([...(headscaleConfig.getOIDCConfig()?.allowedUsers ?? []), user])];

      await headscaleConfig.patch([
        {
          path: "oidc.allowed_users",
          value: users,
        },
      ]);

      integration?.onConfigChange(headscale);
      return data(t("restrictions.user.added"));
    }

    case "remove_user": {
      const user = formData.get("user")?.toString()?.trim();
      if (!user) {
        throw data(t("restrictions.user.required"), {
          status: 400,
        });
      }

      const storedUsers = headscaleConfig.getOIDCConfig()?.allowedUsers ?? [];
      if (!storedUsers.includes(user)) {
        // User not found in the list
        throw data(t("restrictions.user.missing", { value: user }), {
          status: 400,
        });
      }

      // Filter out the user to remove it from the list
      const users = storedUsers.filter((d: string) => d !== user);
      await headscaleConfig.patch([
        {
          path: "oidc.allowed_users",
          value: users,
        },
      ]);

      integration?.onConfigChange(headscale);
      return data(t("restrictions.user.removed"));
    }

    default: {
      throw data(t("restrictions.error.invalid"), {
        status: 400,
      });
    }
  }
}
