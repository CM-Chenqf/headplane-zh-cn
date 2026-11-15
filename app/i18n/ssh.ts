import { defaultLocale, type Locale } from "./locale";
import { createTranslator } from "./messages";

export interface SSHErrorDetails {
  title: string;
  message: string;
  anchor: string;
  // Stable metadata lets the UI translate errors again without revalidating
  // the SSH loader, which could create another session key.
  code?: string;
  hostname?: string;
}

export function sshErrors(locale: Locale = defaultLocale) {
  const t = createTranslator(locale);
  return {
    wasm_missing: {
      code: "wasm_missing",
      title: t("ssh.error.wasm.title"),
      message: t("ssh.error.wasm.description"),
      anchor: "#ssh-not-available",
    },
    agent_required: {
      code: "agent_required",
      title: t("ssh.error.agent.title"),
      message: t("ssh.error.agent.description"),
      anchor: "#agent-required",
    },
    oidc_required: {
      code: "oidc_required",
      title: t("ssh.error.oidc.title"),
      message: t("ssh.error.oidc.description"),
      anchor: "#oidc-required",
    },
    node_not_found: (hostname: string) => ({
      code: "node_not_found",
      hostname,
      title: t("ssh.error.node.title"),
      message: t("ssh.error.node.description", { hostname }),
      anchor: "#node-not-found",
    }),
    user_not_linked: {
      code: "user_not_linked",
      title: t("ssh.error.user.title"),
      message: t("ssh.error.user.description"),
      anchor: "#user-not-linked",
    },
  };
}

export function isSSHError(error: unknown): error is SSHErrorDetails {
  return (
    typeof error === "object" &&
    error !== null &&
    "title" in error &&
    "message" in error &&
    "anchor" in error &&
    typeof error.title === "string" &&
    typeof error.message === "string" &&
    typeof error.anchor === "string"
  );
}

export function localizeSSHError(error: SSHErrorDetails, locale: Locale): SSHErrorDetails {
  const errors = sshErrors(locale);
  switch (error.code) {
    case "node_not_found":
      return typeof error.hostname === "string" ? errors.node_not_found(error.hostname) : error;
    case "wasm_missing":
    case "agent_required":
    case "oidc_required":
    case "user_not_linked":
      return errors[error.code];
    default:
      return error;
  }
}

export type SSHConnectionStatus =
  | { kind: "joining" }
  | { kind: "connecting" }
  | { kind: "stopped" | "failed"; error: string };

function diagnostic(message: string, locale: Locale) {
  if (locale === "en") return message;
  const t = createTranslator(locale);
  const description =
    message === "Unexpected shutdown"
      ? t("ssh.diagnostic.shutdown")
      : message === "Headscale rejected the auth key" ||
          message === "Headscale rejected the pre-auth key"
        ? t("ssh.diagnostic.authRejected")
        : message === "Failed to load Go WASM helper"
          ? t("ssh.diagnostic.helper")
          : undefined;
  return description ? t("ssh.diagnostic.original", { description, message }) : message;
}

export function sshStatus(status: SSHConnectionStatus, hostname: string, locale: Locale): string {
  const t = createTranslator(locale);
  switch (status.kind) {
    case "joining":
      return t("ssh.status.joining");
    case "connecting":
      return t("ssh.status.connecting", { hostname });
    case "stopped":
      return t("ssh.status.stopped", { error: diagnostic(status.error, locale) });
    case "failed":
      return t("ssh.status.failed", { error: diagnostic(status.error, locale) });
  }
}
