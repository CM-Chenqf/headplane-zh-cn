import { data, redirect } from "react-router";

import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import { authContext, headscaleLiveStoreContext, requestApiContext } from "~/server/context";
import { isDataWithApiError } from "~/server/headscale/api/error-client";
import { nodesResource } from "~/server/headscale/live-store";
import { Capabilities } from "~/server/web/roles";
import { normalizeRegistrationKey } from "~/utils/register-key";

import type { Route } from "./+types/machine";

export async function machineAction({ request, context }: Route.ActionArgs) {
  const t = createTranslator(await getLocale(request));
  const auth = context.get(authContext);
  const getRequestApi = context.get(requestApiContext);
  const headscaleLiveStore = context.get(headscaleLiveStoreContext);

  const { principal, api } = await getRequestApi(request);

  const formData = await request.formData();

  const action = formData.get("action_id")?.toString();
  if (!action) {
    throw data(t("machines.error.missing.action_id"), {
      status: 400,
    });
  }

  // Fast track register since it doesn't require an existing machine
  if (action === "register") {
    if (!auth.can(principal, Capabilities.write_machines)) {
      throw data(t("machines.error.manageForbidden"), {
        status: 403,
      });
    }

    const registrationKeyInput = formData.get("register_key")?.toString();
    if (!registrationKeyInput) {
      throw data(t("machines.error.missing.register_key"), {
        status: 400,
      });
    }

    const registrationKey = normalizeRegistrationKey(registrationKeyInput);
    if (!registrationKey) {
      throw data(t("machines.error.invalidRegistration"), {
        status: 400,
      });
    }

    const user = formData.get("user")?.toString();
    if (!user) {
      throw data(t("machines.error.missing.user"), {
        status: 400,
      });
    }

    const node = await api.nodes.register(user, registrationKey);
    await headscaleLiveStore.refresh(nodesResource, api);
    return redirect(`/machines/${node.id}`);
  }

  // Check if the user has permission to manage this machine
  const nodeId = formData.get("node_id")?.toString();
  if (!nodeId) {
    throw data(t("machines.error.missing.node_id"), {
      status: 400,
    });
  }

  const node = await api.nodes.get(nodeId);
  if (!node) {
    throw data(t("machines.error.notFound", { id: nodeId }), {
      status: 404,
    });
  }

  if (!auth.canManageNode(principal, node)) {
    throw data(t("machines.error.forbidden"), {
      status: 403,
    });
  }

  switch (action) {
    case "rename": {
      const newName = formData.get("name")?.toString();
      if (!newName) {
        throw data(t("machines.error.missing.name"), {
          status: 400,
        });
      }

      const name = String(formData.get("name"));
      if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name.toLowerCase())) {
        throw data(t("machines.error.name"), { status: 400 });
      }

      await api.nodes.rename(nodeId, name);
      await headscaleLiveStore.refresh(nodesResource, api);
      return { message: t("machines.success.renamed") };
    }

    case "delete": {
      await api.nodes.delete(nodeId);
      await headscaleLiveStore.refresh(nodesResource, api);
      return redirect("/machines");
    }

    case "expire": {
      await api.nodes.expire(nodeId);
      await headscaleLiveStore.refresh(nodesResource, api);
      return { message: t("machines.success.expired") };
    }

    case "toggle_expiry": {
      const disableExpiry = String(formData.get("disableExpiry")) === "true";
      await api.nodes.toggleExpiry(nodeId, disableExpiry);
      await headscaleLiveStore.refresh(nodesResource, api);
      return {
        message: t(
          disableExpiry ? "machines.success.expiryDisabled" : "machines.success.expiryEnabled",
        ),
      };
    }

    case "update_tags": {
      const tags = formData.get("tags")?.toString().split(",") ?? [];
      if (tags.length === 0) {
        throw data(t("machines.error.missing.tags"), {
          status: 400,
        });
      }

      try {
        await api.nodes.setTags(
          nodeId,
          tags.map((tag) => tag.trim()).filter((tag) => tag !== ""),
        );

        await headscaleLiveStore.refresh(nodesResource, api);
        return { success: true as const, message: t("machines.success.tags") };
      } catch (error) {
        if (isDataWithApiError(error) && error.data.statusCode === 400) {
          const original = extractApiErrorMessage(error.data);
          return data(
            {
              success: false as const,
              error: original
                ? t("machines.error.tagDetails", { message: original })
                : t("machines.error.unknownTags"),
            },
            { status: 400 },
          );
        }

        throw error;
      }
    }

    case "update_routes": {
      const newApproved = node.approvedRoutes;
      const routes = formData.get("routes")?.toString();
      if (!routes) {
        throw data(t("machines.error.missing.routes"), {
          status: 400,
        });
      }

      const allRoutes = routes.split(",").map((route) => route.trim());
      if (allRoutes.length === 0) {
        throw data(t("machines.error.noRoutes"), {
          status: 400,
        });
      }

      const enabled = formData.get("enabled")?.toString();
      if (enabled === undefined) {
        throw data(t("machines.error.missing.enabled"), {
          status: 400,
        });
      }

      if (enabled === "true") {
        for (const route of allRoutes) {
          // If already approved, skip, otherwise add to approved
          if (newApproved.includes(route)) {
            continue;
          }

          newApproved.push(route);
        }
      } else {
        for (const route of allRoutes) {
          // If not approved, skip, otherwise remove from approved
          if (!newApproved.includes(route)) {
            continue;
          }

          const index = newApproved.indexOf(route);
          if (index > -1) {
            newApproved.splice(index, 1);
          }
        }
      }

      await api.nodes.approveRoutes(nodeId, newApproved);
      await headscaleLiveStore.refresh(nodesResource, api);
      return { message: t("machines.success.routes") };
    }

    case "reassign": {
      const user = formData.get("user_id")?.toString();
      if (!user) {
        throw data(t("machines.error.missing.user_id"), {
          status: 400,
        });
      }

      if (!api.nodes.reassignUser) {
        throw data(t("machines.error.ownerVersion"), {
          status: 400,
        });
      }
      await api.nodes.reassignUser(nodeId, user);
      await headscaleLiveStore.refresh(nodesResource, api);
      return { message: t("machines.success.owner") };
    }

    default:
      throw data(t("machines.error.invalidAction"), {
        status: 400,
      });
  }
}

function extractApiErrorMessage(error: { data?: unknown; rawData: string }) {
  if (error.data != null && typeof error.data === "object" && "message" in error.data) {
    const message = (error.data as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return error.rawData.length > 0 ? error.rawData : undefined;
}
