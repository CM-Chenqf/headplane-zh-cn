import { useMemo, useState } from "react";
import { data } from "react-router";

import Attribute from "~/components/attribute";
import Button from "~/components/button";
import Link from "~/components/link";
import PageHeader from "~/components/page-header";
import Section, { SettingList } from "~/components/section";
import StatusCircle from "~/components/status-circle";
import { useI18n } from "~/i18n/provider";
import {
  agentsContext,
  authContext,
  headscaleConfigContext,
  headscaleContext,
  headscaleLiveStoreContext,
  requestApiContext,
} from "~/server/context";
import { nodesResource, usersResource } from "~/server/headscale/live-store";
import { Capabilities } from "~/server/web/roles";
import { getOSInfo, getTSVersion } from "~/utils/host-info";
import { extractTagOwnerTags, isNoExpiry, mapNodes, sortAssignableTags } from "~/utils/node-info";
import { formatDateTime } from "~/utils/time";
import { toastClientAction } from "~/utils/toast";
import { getUserDisplayName, isTaggedDevicesUser } from "~/utils/user";

import type { Route } from "./+types/machine";
import { mapTagsToComponents, uiTagsForNode } from "./components/machine-row";
import MenuOptions from "./components/menu";
import Routes from "./dialogs/routes";
import { machineAction } from "./machine-actions";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const agentsFeature = context.get(agentsContext);
  const auth = context.get(authContext);
  const getRequestApi = context.get(requestApiContext);
  const headscale = context.get(headscaleContext);
  const headscaleConfig = context.get(headscaleConfigContext);
  const headscaleLiveStore = context.get(headscaleLiveStoreContext);

  if (!params.id) {
    throw new Error("No machine ID provided");
  }

  if (params.id.endsWith(".ico")) {
    throw data(null, { status: 204 });
  }

  await auth.requireCapability(request, Capabilities.read_machines);
  const magic = headscaleConfig.getMagicDNSBaseDomain();

  const { api } = await getRequestApi(request);
  const [nodesSnap, usersSnap] = await Promise.all([
    headscaleLiveStore.get(nodesResource, api),
    headscaleLiveStore.get(usersResource, api),
  ]);
  const nodes = nodesSnap.data;
  const users = usersSnap.data;
  const node = nodes.find((node) => node.id === params.id);
  if (node == null) {
    throw data(null, { status: 404 });
  }

  const agents = agentsFeature.state === "enabled" ? agentsFeature.value : undefined;
  const [lookup, policyResult] = await Promise.allSettled([
    agents?.lookup([node.nodeKey]),
    api.policy.get(),
  ]);
  const stats = lookup.status === "fulfilled" ? lookup.value : undefined;
  const [enhancedNode] = mapNodes([node], stats);
  const tags = [...node.tags].toSorted();
  const supportsNodeOwnerChange = !headscale.capabilities.nodeOwnerIsImmutable;
  const supportsDisablingKeyExpiry = headscale.capabilities.keyExpiryCanBeDisabled;
  const agentSync = agents?.lastSync();
  const policy = policyResult.status === "fulfilled" ? policyResult.value.policy : undefined;

  return {
    agent: agentSync
      ? {
          syncedAt: agentSync.syncedAt?.toISOString() ?? null,
          nodeCount: agentSync.nodeCount,
          nodeKey: agents?.agentNodeKey(),
        }
      : undefined,
    existingTags: sortAssignableTags(nodes, policy),
    // `undefined` keeps the tag dialog from flagging every tag as undeclared.
    policyTags: extractTagOwnerTags(policy),
    magic,
    node: enhancedNode,
    stats: stats?.[enhancedNode.nodeKey],
    supportsNodeOwnerChange: supportsNodeOwnerChange,
    supportsDisablingKeyExpiry: supportsDisablingKeyExpiry,
    tags,
    users,
  };
}

export const action = machineAction;

export const clientAction = toastClientAction;

export default function Page({
  loaderData: {
    node,
    tags,
    users,
    magic,
    agent,
    stats,
    existingTags,
    policyTags,
    supportsNodeOwnerChange,
    supportsDisablingKeyExpiry,
  },
}: Route.ComponentProps) {
  const { locale, t } = useI18n();
  const [showRouting, setShowRouting] = useState(false);

  const uiTags = useMemo(() => {
    const tags = uiTagsForNode(node, agent?.nodeKey === node.nodeKey);
    return tags;
  }, [node, agent]);

  const { subnetApprovedRoutes, subnetWaitingRoutes, exitRoutes, exitApproved } =
    node.customRouting;
  const exitStatus = t(
    exitRoutes.length === 0
      ? "machines.notAdvertised"
      : exitApproved
        ? "machines.approved"
        : "machines.waiting",
  );

  return (
    <div className="max-w-5xl">
      <nav aria-label={t("machines.breadcrumb")} className="text-muted mb-3 text-sm">
        <Link className="hover:text-fg" to="/machines">
          {t("nav.machines")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-fg">{node.givenName}</span>
      </nav>
      <PageHeader
        actions={
          <MenuOptions
            existingTags={existingTags}
            policyTags={policyTags}
            isFullButton
            magic={magic}
            node={node}
            users={users}
            supportsNodeOwnerChange={supportsNodeOwnerChange}
            supportsDisablingKeyExpiry={supportsDisablingKeyExpiry}
          />
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {node.user && !(isTaggedDevicesUser(node.user) && tags.length) ? (
              <span>{getUserDisplayName(node.user)}</span>
            ) : undefined}
            {tags.map((tag) => (
              <span className="font-mono" key={tag}>
                {tag}
              </span>
            ))}
            {mapTagsToComponents(node, uiTags)}
          </span>
        }
        title={
          <span className="flex items-center gap-2">
            <StatusCircle isExpired={node.expired} isOnline={node.online && !node.expired} />
            {node.givenName}
          </span>
        }
      />
      <Routes isOpen={showRouting} node={node} setIsOpen={setShowRouting} />
      <Section
        action={<Button onClick={() => setShowRouting(true)}>{t("machines.editRoutes")}</Button>}
        description={
          <>
            {t("machines.routingDescription")}{" "}
            <Link external styled to="https://tailscale.com/kb/1019/subnets">
              {t("common.docs")}
            </Link>
          </>
        }
        title={t("machines.routing")}
      >
        <SettingList>
          <Attribute
            isMono={subnetApprovedRoutes.length > 0}
            name={t("machines.subnetRoutes")}
            tooltip={t("machines.subnetHint")}
            value={
              subnetApprovedRoutes.length > 0 ? subnetApprovedRoutes.join("\n") : t("common.none")
            }
          />
          {subnetWaitingRoutes.length > 0 ? (
            <Attribute
              isMono
              name={t("machines.waiting")}
              tooltip={t("machines.waitingHint")}
              value={subnetWaitingRoutes.join("\n")}
            />
          ) : undefined}
          <Attribute
            name={t("machines.exitNode")}
            tooltip={t("machines.exitHint")}
            value={exitStatus}
          />
        </SettingList>
      </Section>
      <Section description={t("machines.machineDescription")} title={t("machines.machine")}>
        <SettingList>
          <Attribute
            name={t("machines.owner")}
            value={node.user ? getUserDisplayName(node.user) : t("machines.tagOwned")}
          />
          <Attribute name={t("machines.machineName")} value={node.givenName} />
          <Attribute
            name={t("machines.hostname")}
            tooltip={t("machines.hostnameHint")}
            value={node.name}
          />
          {stats ? (
            <>
              <Attribute name={t("machines.os")} value={getOSInfo(stats, locale)} />
              <Attribute
                isMono
                name={t("machines.tailscaleVersion")}
                value={getTSVersion(stats, locale)}
              />
            </>
          ) : undefined}
          <Attribute
            name={t("machines.created")}
            value={formatDateTime(new Date(node.createdAt), locale)}
          />
          <Attribute
            name={t("machines.lastSeen")}
            value={
              node.online ? t("common.connected") : formatDateTime(new Date(node.lastSeen), locale)
            }
          />
          <Attribute
            name={t("machines.keyExpiry")}
            value={
              !isNoExpiry(node.expiry)
                ? formatDateTime(new Date(node.expiry!), locale)
                : t("common.never")
            }
          />
          <Attribute isMono name="ID" tooltip={t("machines.idHint")} value={node.id} />
          <Attribute
            isCopyable
            isMono
            name={t("machines.nodeKey")}
            tooltip={t("machines.nodeKeyHint")}
            value={node.nodeKey}
          />
        </SettingList>
      </Section>
      <Section description={t("machines.addressesDescription")} title={t("machines.addresses")}>
        <SettingList>
          <Attribute
            isCopyable
            isMono
            name="Tailscale IPv4"
            tooltip={t("machines.ipv4Hint")}
            value={getIpv4Address(node.ipAddresses)}
          />
          <Attribute
            isCopyable
            isMono
            name="Tailscale IPv6"
            tooltip={t("machines.ipv6Hint")}
            value={getIpv6Address(node.ipAddresses)}
          />
          <Attribute
            isCopyable
            isMono
            name={t("machines.shortDomain")}
            tooltip={t("machines.shortDomainHint")}
            value={node.givenName}
          />
          {magic ? (
            <Attribute
              isCopyable
              isMono
              name={t("machines.fullDomain")}
              tooltip={t("machines.fullDomainHint")}
              value={`${node.givenName}.${magic}`}
            />
          ) : undefined}
        </SettingList>
      </Section>
      {stats ? (
        <Section
          description={t("machines.connectivityDescription")}
          title={t("machines.connectivity")}
        >
          <SettingList>
            {stats.Endpoints ? (
              <Attribute isMono name={t("machines.endpoints")} value={stats.Endpoints.join("\n")} />
            ) : undefined}
            <Attribute
              name={t("machines.varies")}
              tooltip={t("machines.natHint")}
              value={t(stats.NetInfo?.MappingVariesByDestIP ? "common.yes" : "common.no")}
            />
            <Attribute
              name={t("machines.hairpinning")}
              tooltip={t("machines.hairpinningHint")}
              value={t(stats.NetInfo?.HairPinning ? "common.yes" : "common.no")}
            />
            <Attribute
              name="IPv6"
              value={t(stats.NetInfo?.WorkingIPv6 ? "common.yes" : "common.no")}
            />
            <Attribute
              name="UDP"
              value={t(stats.NetInfo?.WorkingUDP ? "common.yes" : "common.no")}
            />
            <Attribute name="UPnP" value={t(stats.NetInfo?.UPnP ? "common.yes" : "common.no")} />
            <Attribute name="PCP" value={t(stats.NetInfo?.PCP ? "common.yes" : "common.no")} />
            <Attribute name="NAT-PMP" value={t(stats.NetInfo?.PMP ? "common.yes" : "common.no")} />
          </SettingList>
        </Section>
      ) : undefined}
    </div>
  );
}

function getIpv4Address(addresses: string[]) {
  for (const address of addresses) {
    if (address.startsWith("100.")) {
      // Return the first CGNAT address
      return address;
    }
  }

  return "—";
}

function getIpv6Address(addresses: string[]) {
  for (const address of addresses) {
    if (address.startsWith("fd")) {
      // Return the first IPv6 address
      return address;
    }
  }

  return "—";
}
