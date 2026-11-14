import { useFetcher } from "react-router";

import Button from "~/components/button";
import Callout from "~/components/callout";
import Link from "~/components/link";
import PageError from "~/components/page-error";
import PageHeader from "~/components/page-header";
import Section, { Row, RowList, SettingList, SettingRow } from "~/components/section";
import StatusCircle from "~/components/status-circle";
import { agentError, agentReason } from "~/i18n/agent";
import { getLocale } from "~/i18n/locale.server";
import { Message, useI18n } from "~/i18n/provider";
import {
  agentsContext,
  authContext,
  headscaleContext,
  headscaleLiveStoreContext,
  requestApiContext,
} from "~/server/context";
import { nodesResource } from "~/server/headscale/live-store";
import { Capabilities } from "~/server/web/roles";
import { getTSVersion } from "~/utils/host-info";
import { formatDateTime, formatTimeDelta } from "~/utils/time";

import type { Route } from "./+types/agent";

export async function loader({ request, context }: Route.LoaderArgs) {
  const agents = context.get(agentsContext);
  const auth = context.get(authContext);
  const getRequestApi = context.get(requestApiContext);
  const headscale = context.get(headscaleContext);
  const headscaleLiveStore = context.get(headscaleLiveStoreContext);

  await auth.requireCapability(request, Capabilities.read_machines);

  if (agents.state !== "enabled") {
    return {
      enabled: false as const,
      reason: agentReason(agents.reason, await getLocale(request)),
    };
  }

  // The sync status matters most when Headscale is down, so the page still
  // loads without the machine list.
  const { api } = await getRequestApi(request);
  const [isHealthy, fetched] = await Promise.all([
    headscale.health(),
    headscaleLiveStore
      .get(nodesResource, api)
      .then((snap) => snap.data)
      .catch(() => undefined),
  ]);
  const nodes = fetched ?? [];
  const sync = agents.value.lastSync();
  const selfKey = agents.value.agentNodeKey();
  const self = nodes.find((node) => node.nodeKey === selfKey);
  const others = nodes.filter((node) => node.nodeKey !== selfKey);

  const [selfInfo, updatedAt] = await Promise.all([
    agents.value.lookup(selfKey ? [selfKey] : []),
    agents.value.lastUpdated(others.map((node) => node.nodeKey)),
  ]);

  const synced = new Set(sync.syncedKeys);
  const missing = others
    .filter((node) => !synced.has(node.nodeKey))
    .map((node) => ({
      id: node.id,
      name: node.givenName,
      isOnline: node.online,
      updatedAt: updatedAt[node.nodeKey]?.toISOString() ?? null,
    }));

  return {
    enabled: true as const,
    // The layout already shows a banner when Headscale is down.
    isHeadscaleDown: !isHealthy,
    hasMachines: fetched !== undefined,
    syncedAt: sync.syncedAt?.toISOString() ?? null,
    startedAt: sync.startedAt?.toISOString() ?? null,
    intervalMs: sync.intervalMs,
    consecutiveErrors: sync.consecutiveErrors,
    error: sync.error,
    authUrl: sync.authUrl,
    self: self
      ? {
          id: self.id,
          name: self.givenName,
          isOnline: self.online,
          addresses: self.ipAddresses,
          version: selfKey && selfInfo[selfKey] ? getTSVersion(selfInfo[selfKey]) : undefined,
        }
      : undefined,
    machineCount: others.length,
    missing,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const agents = context.get(agentsContext);
  const auth = context.get(authContext);

  await auth.requireCapability(request, Capabilities.read_machines);

  if (agents.state !== "enabled") {
    return { success: false, error: agentReason(agents.reason, await getLocale(request)) };
  }

  await agents.value.triggerSync();
  const sync = agents.value.lastSync();
  return {
    success: !sync.error,
    error: sync.error ? agentError(sync.error, await getLocale(request)) : sync.error,
    authUrl: sync.authUrl,
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { locale, t } = useI18n();
  const fetcher = useFetcher<typeof action>();
  const description = (
    <Message
      id="agent.description"
      values={{
        docs: (
          <Link external styled to="https://headplane.net/features/agent">
            {t("common.docs")}
          </Link>
        ),
      }}
    />
  );

  if (!loaderData.enabled) {
    return (
      <>
        <PageHeader description={description} isSubpage title={t("agent.title")} />
        <Callout title={t("agent.off")}>
          {loaderData.reason}
          {locale === "en" ? "." : "。"}
        </Callout>
      </>
    );
  }

  const { self, missing, machineCount, isHeadscaleDown, hasMachines } = loaderData;
  const unavailable = <p className="text-muted py-2.5 text-sm">{t("agent.unavailable")}</p>;
  const isPending = !loaderData.syncedAt && Boolean(loaderData.authUrl);
  const hasError = Boolean(loaderData.error);
  const intervalMinutes = Math.max(1, Math.round(loaderData.intervalMs / 60_000));

  return (
    <>
      <PageHeader
        actions={
          <fetcher.Form method="post">
            <Button pending={fetcher.state !== "idle"} type="submit">
              {t("agent.syncNow")}
            </Button>
          </fetcher.Form>
        }
        description={description}
        isSubpage
        title={t("agent.title")}
      />
      {isPending && loaderData.authUrl && (
        <Callout className="mb-6" title={t("agent.pending")} variant="warning">
          <Message
            id="agent.pendingDescription"
            values={{
              approve: (
                <Link external styled to={loaderData.authUrl}>
                  {t("agent.approve")}
                </Link>
              ),
            }}
          />
        </Callout>
      )}
      {loaderData.error && !isHeadscaleDown && (
        <Callout className="mb-6" title={t("agent.failed")} variant="error">
          {agentError(loaderData.error, locale)}
        </Callout>
      )}
      <Section title={t("agent.sync")}>
        <SettingList>
          <SettingRow label={t("agent.status")}>
            <span className="flex items-center gap-2">
              <StatusCircle isExpired={hasError} isOnline={!hasError && !isPending} />
              {hasError
                ? t(loaderData.consecutiveErrors === 1 ? "agent.failingOne" : "agent.failingMany", {
                    count: loaderData.consecutiveErrors,
                  })
                : isPending
                  ? t("agent.pending")
                  : t("agent.healthy")}
            </span>
          </SettingRow>
          <SettingRow label={t("agent.lastSynced")}>
            {loaderData.syncedAt ? (
              <span
                suppressHydrationWarning
                title={formatDateTime(new Date(loaderData.syncedAt), locale)}
              >
                {formatTimeDelta(new Date(loaderData.syncedAt), locale)}
              </span>
            ) : (
              <span className="text-muted">{t("agent.neverSynced")}</span>
            )}
            <span className="text-muted">
              {" "}
              ·{" "}
              {t(intervalMinutes === 1 ? "agent.everyMinute" : "agent.everyMinutes", {
                count: intervalMinutes,
              })}
            </span>
          </SettingRow>
          <SettingRow label={t("agent.process")}>
            {loaderData.startedAt ? (
              <span
                suppressHydrationWarning
                title={formatDateTime(new Date(loaderData.startedAt), locale)}
              >
                {t("time.started", {
                  time: formatTimeDelta(new Date(loaderData.startedAt), locale),
                })}
              </span>
            ) : (
              <span className="text-muted">{t("agent.notRunning")}</span>
            )}
          </SettingRow>
        </SettingList>
      </Section>
      <Section description={t("agent.machineDescription")} title={t("agent.machineTitle")}>
        {!hasMachines ? (
          unavailable
        ) : self ? (
          <SettingList>
            <SettingRow label={t("agent.machine")}>
              <span className="flex items-center gap-2">
                <StatusCircle isOnline={self.isOnline} />
                <Link styled to={`/machines/${self.id}`}>
                  {self.name}
                </Link>
              </span>
            </SettingRow>
            <SettingRow label={t("agent.address")}>
              <span className="font-mono text-xs">{self.addresses[0] ?? t("common.none")}</span>
            </SettingRow>
            <SettingRow label={t("agent.version")}>
              <span className="font-mono text-xs">{self.version ?? t("common.unknown")}</span>
            </SettingRow>
          </SettingList>
        ) : (
          <p className="text-muted py-2.5 text-sm">{t("agent.notJoined")}</p>
        )}
      </Section>
      <Section description={t("agent.coverageDescription")} title={t("agent.coverage")}>
        {!hasMachines ? (
          unavailable
        ) : (
          <p className="py-2.5 text-sm">
            {t(machineCount === 1 ? "agent.coverageOne" : "agent.coverageMany", {
              synced: machineCount - missing.length,
              total: machineCount,
            })}
          </p>
        )}
        {missing.length > 0 && (
          <RowList>
            {missing.map((node) => (
              <Row
                action={
                  <span className="text-muted text-sm whitespace-nowrap" suppressHydrationWarning>
                    {node.updatedAt
                      ? t("time.detailsFrom", {
                          time: formatTimeDelta(new Date(node.updatedAt), locale),
                        })
                      : t("agent.noDetails")}
                  </span>
                }
                key={node.id}
              >
                <span className="flex items-center gap-2 text-sm">
                  <StatusCircle isOnline={node.isOnline} />
                  <Link styled to={`/machines/${node.id}`}>
                    {node.name}
                  </Link>
                </span>
              </Row>
            ))}
          </RowList>
        )}
      </Section>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useI18n();
  return <PageError error={error} page={t("agent.page")} />;
}
