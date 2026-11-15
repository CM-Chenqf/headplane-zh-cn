import { Loader2, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { data, isRouteErrorResponse, type ShouldRevalidateFunction } from "react-router";

import Button from "~/components/button";
import Card from "~/components/card";
import Code from "~/components/code";
import LanguageSwitch from "~/components/language-switch";
import StatusBanner from "~/components/status-banner";
import { getLocale } from "~/i18n/locale.server";
import { Message, useI18n } from "~/i18n/provider";
import { sshStatus, type SSHConnectionStatus } from "~/i18n/ssh";
import {
  agentsContext,
  appConfigContext,
  headscaleContext,
  requestApiContext,
} from "~/server/context";
import { findHeadscaleUserBySubject } from "~/server/web/headscale-identity";

import type { Route } from "./+types/page";
import { isSSHError, SSHErrorBoundary, sshErrors } from "./errors";
import Ghostty from "./ghostty.client";
import UserPrompt from "./user-prompt";
import { connectTailnet } from "./wasm.client";

const WASM_MODULE_URL = `${__PREFIX__}/hp_ssh.wasm`;
const WASM_HELPER_URL = `${__PREFIX__}/wasm_exec.js`;
const SSH_PREAUTH_KEY_TTL_MS = 10 * 60 * 1000;

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

export async function loader({ request, params, context, url }: Route.LoaderArgs) {
  const errors = sshErrors(await getLocale(request));
  const agents = context.get(agentsContext);
  const config = context.get(appConfigContext);
  const headscale = context.get(headscaleContext);
  const getRequestApi = context.get(requestApiContext);
  const compatibilityWarning = getBrowserSSHCompatibilityWarning(headscale.version);

  const origin = url.origin;
  const assets = [WASM_HELPER_URL, WASM_MODULE_URL];
  const missing: string[] = [];

  for (const file of assets) {
    const res = await fetch(`${origin}${file}`, { method: "HEAD" });
    if (!res.ok) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    throw data(errors.wasm_missing, 405);
  }

  if (agents.state !== "enabled") {
    throw data(errors.agent_required, 400);
  }

  const { principal, api } = await getRequestApi(request);
  if (principal.kind === "api_key") {
    throw data(errors.oidc_required, 403);
  }

  const hostname = params.id;
  const username = url.searchParams.get("user") || undefined;

  const nodes = await api.nodes.list();
  const node = nodes.find((n) => n.givenName === hostname);
  if (!node) {
    throw data(errors.node_not_found(hostname), 404);
  }

  if (!node.online) {
    return { hostname, username, offline: true, node: undefined, compatibilityWarning };
  }

  if (!username) {
    return {
      hostname,
      username: undefined,
      offline: false,
      node: undefined,
      compatibilityWarning,
    };
  }

  // The user must exist within Headscale to generate a pre-auth key
  const users = await api.users.list();
  const hsUser = principal.user.headscaleUserId
    ? users.find((u) => u.id === principal.user.headscaleUserId)
    : findHeadscaleUserBySubject(users, principal.user.subject, principal.profile.email);

  if (!hsUser) {
    throw data(errors.user_not_linked, 404);
  }

  const preAuthKey = await api.preAuthKeys.create({
    user: hsUser.id,
    ephemeral: true,
    reusable: false,
    expiration: new Date(Date.now() + SSH_PREAUTH_KEY_TTL_MS),
    aclTags: null,
  });

  const controlURL = config.headscale.public_url ?? config.headscale.url;
  return {
    hostname,
    username,
    offline: false,
    node: {
      ipAddress: node.ipAddresses[0],
      controlURL,
      preAuthKey: preAuthKey.key,
      ephemeralHostname: generateHostname(username),
    },
    compatibilityWarning,
  };
}

function getBrowserSSHCompatibilityWarning(version: {
  unknown: boolean;
  major: number;
  minor: number;
  patch: number;
  raw: string;
}) {
  if (version.unknown) return null;
  if (version.major === 0 && version.minor === 29 && version.patch < 2) {
    return { version: version.raw };
  }
  return null;
}

function generateHostname(username: string) {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `ssh-${hex}-${username}`;
}

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    href: WASM_MODULE_URL,
    as: "fetch",
    type: "application/wasm",
    crossOrigin: "anonymous",
  },
];

export default function Page(props: Route.ComponentProps) {
  return (
    <>
      <SSHLanguageSwitch />
      <SSHPage {...props} />
    </>
  );
}

function SSHLanguageSwitch() {
  return (
    <div className="fixed right-4 bottom-4 z-[70] rounded-lg bg-white/95 shadow-sm dark:bg-mist-900/95">
      <LanguageSwitch />
    </div>
  );
}

function SSHPage({ loaderData }: Route.ComponentProps) {
  const { t } = useI18n();
  const { hostname, username, offline, node, compatibilityWarning } = loaderData;

  if (offline) {
    return (
      <>
        <BrowserSSHCompatibilityBanner warning={compatibilityWarning} />
        <div className="flex h-screen w-screen items-center justify-center bg-black">
          <Card className="w-screen" variant="flat">
            <div className="flex items-center justify-between gap-4">
              <Card.Title>{t("ssh.offline.title", { hostname })}</Card.Title>
              <WifiOff className="mb-2 h-6 w-6 text-red-500" />
            </div>
            <Card.Text>{t("ssh.offline.description")}</Card.Text>
            <Button className="mt-8 w-full" onClick={() => window.location.reload()}>
              {t("ssh.retry")}
            </Button>
          </Card>
        </div>
      </>
    );
  }

  if (!username || !node) {
    return (
      <>
        <BrowserSSHCompatibilityBanner warning={compatibilityWarning} />
        <UserPrompt hostname={hostname} />
      </>
    );
  }

  return (
    <>
      <BrowserSSHCompatibilityBanner warning={compatibilityWarning} />
      <SSHConsole hostname={hostname} username={username} node={node} />
    </>
  );
}

function BrowserSSHCompatibilityBanner({
  warning,
}: {
  warning: { version: string } | null | undefined;
}) {
  const { t } = useI18n();
  if (!warning) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-2xl">
      <StatusBanner
        variant="warning"
        title={t("ssh.compatibility.title", { version: warning.version })}
      >
        <Message
          id="ssh.compatibility.description"
          values={{ path: <Code>/ts2021</Code>, status: <Code>405 Method Not Allowed</Code> }}
        />
      </StatusBanner>
    </div>
  );
}

function SSHConsole({
  hostname,
  username,
  node,
}: {
  hostname: string;
  username: string;
  node: { ipAddress: string; controlURL: string; preAuthKey: string; ephemeralHostname: string };
}) {
  const { locale, t } = useI18n();
  const onConnected = useCallback(() => setConnected(true), []);
  const [ipn, setIpn] = useState<IPN | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<SSHConnectionStatus>({ kind: "joining" });

  useEffect(() => {
    let cancelled = false;

    connectTailnet({
      controlURL: node.controlURL,
      authKey: node.preAuthKey,
      hostname: node.ephemeralHostname,
      onPanic: (error) => {
        if (!cancelled) setStatus({ kind: "stopped", error });
      },
    }).then(
      (instance) => {
        if (cancelled) return;
        setStatus({ kind: "connecting" });
        setIpn(instance);
      },
      (error: unknown) => {
        if (cancelled) return;
        setStatus({
          kind: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [node, hostname]);

  return (
    <div
      role="region"
      aria-label={t("ssh.terminal", { username, hostname })}
      className="fixed inset-0 flex flex-col bg-black"
    >
      {!connected && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-mist-200" />
            <p className="text-sm text-mist-400">{sshStatus(status, hostname, locale)}</p>
          </div>
        </div>
      )}

      {ipn && (
        <Ghostty
          ipn={ipn}
          username={username}
          ipAddress={node.ipAddress}
          onConnected={onConnected}
        />
      )}
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const routeError = isRouteErrorResponse(error) ? error.data : null;
  if (routeError == null || !isSSHError(routeError)) {
    // Pass through further down the tree to the global error boundary
    throw error;
  }

  return (
    <>
      <SSHLanguageSwitch />
      <div className="flex h-screen w-screen items-center justify-center">
        <SSHErrorBoundary {...routeError} />
      </div>
    </>
  );
}
