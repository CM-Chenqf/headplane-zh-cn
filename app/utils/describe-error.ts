import { isRouteErrorResponse } from "react-router";

import { defaultLocale, type Locale } from "~/i18n/locale";
import { createTranslator } from "~/i18n/messages";
import { isApiError, isConnectionError } from "~/server/headscale/api/error-client";

export interface ErrorInfo {
  kind: "connection" | "forbidden" | "not_found" | "headscale" | "unknown";
  title: string;
  description: string;
  details?: string;
}

export function describeError(error: unknown, locale: Locale = defaultLocale): ErrorInfo {
  const t = createTranslator(locale);
  if (isRouteErrorResponse(error)) {
    const { data, status, statusText } = error;
    if (isConnectionError(data)) {
      return {
        kind: "connection",
        title: t("error.connectionTitle"),
        description: t("error.connectionDescription"),
        details: lines(data.requestUrl, data.errorMessage || data.errorCode),
      };
    }

    if (isApiError(data)) {
      const details = lines(
        `${data.statusCode} ${data.requestUrl}`,
        data.data != null ? json(data.data) : data.rawData,
      );

      if (data.statusCode >= 500) {
        return {
          kind: "headscale",
          title: t("error.headscaleTitle"),
          description: t("error.headscaleDescription", { status: data.statusCode }),
          details,
        };
      }

      if (data.statusCode === 401 || data.statusCode === 403) {
        return {
          kind: "headscale",
          title: t("error.rejectedTitle"),
          description: t("error.rejectedDescription"),
          details,
        };
      }

      return {
        kind: "headscale",
        title: t("error.unexpectedTitle"),
        description: t("error.unexpectedDescription"),
        details,
      };
    }

    if (status === 404) {
      return {
        kind: "not_found",
        title: t("error.notFoundTitle"),
        description: t("error.notFoundDescription"),
      };
    }

    const message = messageOf(data);

    if (status === 403) {
      return {
        kind: "forbidden",
        title: t("error.forbiddenTitle"),
        description:
          locale === "en"
            ? (message ?? t("error.forbiddenDescription"))
            : t("error.forbiddenDescription"),
        ...(locale !== "en" && message ? { details: message } : {}),
      };
    }

    return {
      kind: "unknown",
      title: t("error.unknownTitle"),
      description:
        locale === "en"
          ? (message ??
            t("error.serverDescription", {
              status: [status, statusText].filter(Boolean).join(" "),
            }))
          : t("error.serverDescription", { status }),
      ...(locale !== "en" && message ? { details: message } : {}),
    };
  }

  if (error instanceof Error) {
    let root = error;
    while (root.cause instanceof Error) {
      root = root.cause;
    }

    const message =
      root instanceof AggregateError
        ? root.errors.map((e) => (e instanceof Error ? e.message : String(e))).join("\n")
        : root.message;

    return {
      kind: "unknown",
      title: t("error.unknownTitle"),
      description: t("error.bug"),
      details: `${root.name}: ${message}`,
    };
  }

  return {
    kind: "unknown",
    title: t("error.unknownTitle"),
    description: t("error.bug"),
    details: json(error),
  };
}

function messageOf(data: unknown) {
  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  if (typeof data === "object" && data !== null && "message" in data) {
    return typeof data.message === "string" ? data.message : undefined;
  }
}

function lines(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join("\n\n");
}

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}
