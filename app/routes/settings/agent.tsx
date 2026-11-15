import { useFetcher } from "react-router";

import Button from "~/components/button";
import Link from "~/components/link";
import Notice from "~/components/notice";
import StatusCircle from "~/components/status-circle";
import Text from "~/components/text";
import Title from "~/components/title";
import { agentError, agentReason } from "~/i18n/agent";
import { useI18n } from "~/i18n/provider";
import { agentsContext, authContext } from "~/server/context";
import { formatTimeDelta } from "~/utils/time";

import type { Route } from "./+types/agent";

export async function loader({ request, context }: Route.LoaderArgs) {
  const agents = context.get(agentsContext);
  const auth = context.get(authContext);

  await auth.require(request);

  if (agents.state !== "enabled") {
    return { enabled: false as const, reason: agents.reason };
  }

  const sync = agents.value.lastSync();
  return {
    enabled: true as const,
    syncedAt: sync.syncedAt?.toISOString() ?? null,
    nodeCount: sync.nodeCount,
    error: sync.error,
    authUrl: sync.authUrl,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const agents = context.get(agentsContext);
  const auth = context.get(authContext);

  await auth.require(request);

  if (agents.state !== "enabled") {
    return { success: false, error: agents.reason };
  }

  await agents.value.triggerSync();
  const sync = agents.value.lastSync();
  return {
    success: !sync.error,
    error: sync.error,
    authUrl: sync.authUrl,
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { locale, t } = useI18n();
  const fetcher = useFetcher<typeof action>();
  const isSyncing = fetcher.state !== "idle";

  if (!loaderData.enabled) {
    return (
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-8">
        <Title>{t("agent.title")}</Title>
        <Notice title={t("agent.notEnabled")}>
          {agentReason(loaderData.reason, locale)}. {t("agent.setupHint")}{" "}
          <Link external styled to="https://headplane.net/features/agent">
            {t("common.docs")}
          </Link>
        </Notice>
      </div>
    );
  }

  const isPending = !loaderData.syncedAt && loaderData.authUrl;
  const hasError = Boolean(loaderData.error);

  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-8">
      <div className="flex w-full flex-col sm:w-2/3">
        <Title>{t("agent.title")}</Title>
        <Text>{t("agent.description")}</Text>
      </div>

      <div className="flex items-center gap-3">
        <StatusCircle isOnline={!hasError && !isPending} className="h-5 w-5" />
        <span className="text-lg font-medium">
          {t(hasError ? "common.error" : isPending ? "agent.pending" : "agent.healthy")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Text>
          <span className="font-medium">
            {t("agent.lastSynced")}
            {": "}
          </span>
          {loaderData.syncedAt ? (
            <span suppressHydrationWarning>
              {formatTimeDelta(new Date(loaderData.syncedAt), locale)}
            </span>
          ) : (
            t("common.never")
          )}
        </Text>
        <Text>
          <span className="font-medium">
            {t("agent.nodesSynced")}
            {": "}
          </span>
          {loaderData.nodeCount}
        </Text>
      </div>

      {isPending ? (
        <Notice variant="warning" title={t("agent.approvalTitle")}>
          {t("agent.approvalDescription")}{" "}
          <Link external styled to={loaderData.authUrl!}>
            {t("agent.approveLink")}
          </Link>
          .
        </Notice>
      ) : undefined}

      {loaderData.error ? (
        <Notice variant="error" title={t("agent.syncError")}>
          {agentError(loaderData.error, locale)}
        </Notice>
      ) : undefined}

      <fetcher.Form method="post">
        <Button type="submit" variant="heavy" disabled={isSyncing}>
          {t(isSyncing ? "agent.syncing" : "agent.syncNow")}
        </Button>
      </fetcher.Form>
    </div>
  );
}
