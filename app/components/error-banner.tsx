import { AlertCircle } from "lucide-react";
import { isRouteErrorResponse } from "react-router";

import { defaultLocale, type Locale } from "~/i18n/locale";
import { createTranslator } from "~/i18n/messages";
import { Message, useI18n } from "~/i18n/provider";
import { isApiError, isConnectionError } from "~/server/headscale/api/error-client";
import cn from "~/utils/cn";

import Card from "./card";
import Code from "./code";
import Link from "./link";

export function getErrorMessage(
  error: Error | unknown,
  locale: Locale = defaultLocale,
): {
  title: string;
  jsxMessage: React.ReactNode;
} {
  const t = createTranslator(locale);
  if (isRouteErrorResponse(error)) {
    if (isApiError(error.data)) {
      const { statusCode, rawData, data, requestUrl } = error.data;
      if (statusCode >= 500) {
        return {
          jsxMessage: (
            <>
              <Card.Text>
                {t("error.apiCommunication")}
                <br />
                <Message
                  locale={locale}
                  id="error.apiServer"
                  values={{ status: <strong>{statusCode}</strong> }}
                />
              </Card.Text>
              {(error.data.data != null || error.data.rawData != null) && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-mist-100 p-2 dark:bg-mist-800">
                  {error.data.data != null ? (
                    <code>{JSON.stringify(error.data.data, null, 2)}</code>
                  ) : (
                    <code>{error.data.rawData}</code>
                  )}
                </pre>
              )}
            </>
          ),
          title: t("error.apiTitle"),
        };
      }

      const authError = error.data.statusCode === 401 || error.data.statusCode === 403;

      return {
        jsxMessage: (
          <>
            <Card.Text className="leading-snug">
              {t("error.apiUnexpected")}
              {authError ? <> {t("error.apiAuth")}</> : <> {t("error.apiUnsupported")}</>}
            </Card.Text>
            <ul className="mt-2 list-inside list-disc">
              <li>
                <Message
                  locale={locale}
                  id="common.requestUrl"
                  values={{ url: <Code>{requestUrl}</Code> }}
                />
              </li>
              <li>
                {t("common.statusCode", { status: "" })}{" "}
                <Code>
                  {/* @ts-expect-error */}
                  {data === null ? (
                    <>
                      {statusCode} {rawData}
                    </>
                  ) : (
                    <>
                      {statusCode} {error.statusText}
                    </>
                  )}
                </Code>
              </li>
            </ul>
            <Card.Text className="mt-4 text-lg font-semibold">{t("common.errorDetails")}</Card.Text>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-mist-100 p-2 dark:bg-mist-800">
              <code>{JSON.stringify(error.data, null, 2)}</code>
            </pre>
          </>
        ),
        title: t("error.apiInvalidTitle"),
      };
    }

    if (isConnectionError(error.data)) {
      const { requestUrl, errorCode, errorMessage, extraData } = error.data;
      return {
        jsxMessage: (
          <>
            <Card.Text className="leading-snug">{t("error.connectionHint")}</Card.Text>
            <Card.Text className="mt-4 text-lg font-semibold">{t("common.errorDetails")}</Card.Text>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-mist-100 p-2 dark:bg-mist-800">
              {requestUrl}
              <br />
              {errorCode}: {errorMessage}
              {extraData != null && (
                <>
                  <br />
                  <br />
                  <code>{JSON.stringify(extraData, null, 2)}</code>
                </>
              )}
            </pre>
          </>
        ),
        title: t("error.connectionTitle"),
      };
    }

    return {
      jsxMessage: (
        <>
          {t("error.processing")}
          <br />
          <Message
            locale={locale}
            id="common.statusCode"
            values={{ status: <strong>{error.status}</strong> }}
          />
          <br />
          {t("common.statusText", { text: "" })} <strong>{error.data}</strong>
        </>
      ),
      title: t("common.errorStatus", { status: error.status }),
    };
  }

  if (!(error instanceof Error)) {
    return {
      jsxMessage: (
        <>
          <Card.Text>
            <Message
              locale={locale}
              id="error.report"
              values={{
                link: (
                  <Link external styled to="https://github.com/tale/headplane/issues">
                    Headplane GitHub
                  </Link>
                ),
              }}
            />
          </Card.Text>
          <Card.Text className="mt-4 text-lg font-semibold">{t("common.errorDetails")}</Card.Text>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-mist-100 p-2 dark:bg-mist-800">
            <code>{JSON.stringify(error, null, 2)}</code>
          </pre>
        </>
      ),
      title: t("common.unexpectedError"),
    };
  }

  // Traverse the error chain to find the root cause
  let rootError = error;
  if (error.cause != null) {
    rootError = error.cause as Error;
    while (rootError.cause != null) {
      rootError = rootError.cause as Error;
    }
  }

  // TODO: If we are aggregate, concat into a single message
  if (rootError instanceof AggregateError) {
    throw new Error("AggregateError handling not implemented yet");
  }

  return {
    jsxMessage: (
      <>
        <p>{t("error.original")}</p>
        <pre className="break-words whitespace-pre-wrap">{rootError.message}</pre>
      </>
    ),
    title:
      rootError.name.length > 0 && rootError.name !== "Error"
        ? t("common.errorName", { name: rootError.name })
        : t("common.error"),
  };
}

interface ErrorBannerProps {
  error: unknown;
  className?: string;
}

export function ErrorBanner({ error, className }: ErrorBannerProps) {
  const { locale } = useI18n();
  const { title, jsxMessage } = getErrorMessage(error, locale);

  return (
    <Card className={cn("w-screen", className)} variant="flat">
      <div className="flex items-center justify-between gap-4">
        <Card.Title>{title}</Card.Title>
        <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
      </div>
      {jsxMessage}
    </Card>
  );
}
