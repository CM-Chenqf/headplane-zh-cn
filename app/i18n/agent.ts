import type { Locale } from "./locale";
import { translate } from "./messages";

// Match known upstream diagnostics at the display boundary. Logs and unknown
// diagnostics keep their original text, even when the interface is Chinese.
const reasons = {
  "Agent is not enabled in the configuration": "agent.reason.disabled",
  "Agent requires headscale.api_key to be configured": "agent.reason.apiKey",
  "Agent requires Headscale 0.28 or newer": "agent.reason.version",
  "Agent failed to initialize (see logs)": "agent.reason.initialize",
} as const;

const errors = {
  "Headscale didn't delete a node in time": "agent.error.deleteNodeTimeout",
  "The agent manager has been shut down": "agent.error.stopped",
  "Another agent manager is still using the work dir": "agent.error.workDir",
  "Agent process closed unexpectedly": "agent.error.closed",
  "Headscale didn't create an auth key in time": "agent.error.authKeyTimeout",
  "The agent didn't answer in time": "agent.error.replyTimeout",
  "Headscale didn't list nodes in time": "agent.error.nodesTimeout",
  "Headscale didn't delete the previous node in time": "agent.error.deleteTimeout",
  "Headscale didn't rename the agent's node in time": "agent.error.renameTimeout",
} as const;

export function agentReason(reason: string, locale: Locale): string {
  const key = Object.entries(reasons).find(([message]) => message === reason)?.[1];
  return key ? translate(locale, key) : translate(locale, "agent.reason.unknown", { reason });
}

export function agentError(message: string, locale: Locale): string {
  if (locale === "en") return message;
  const key = Object.entries(errors).find(([text]) => text === message)?.[1];
  return key
    ? translate(locale, "agent.error.diagnostic", { description: translate(locale, key), message })
    : translate(locale, "agent.error.unknown", { message });
}
