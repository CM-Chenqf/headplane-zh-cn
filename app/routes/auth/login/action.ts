import { redirect } from "react-router";

import { getLocale } from "~/i18n/locale.server";
import { type MessageKey, translate } from "~/i18n/messages";
import { authContext, headscaleContext } from "~/server/context";
import { headscaleErrorMessage, isDataWithApiError } from "~/server/headscale/api/error-client";
import log from "~/utils/log";

import type { Route } from "./+types/page";

export async function loginAction({ request, context }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const headscale = context.get(headscaleContext);
  const locale = await getLocale(request);
  function failure(messageKey: Extract<MessageKey, `login.error.${string}`>) {
    return { success: false as const, message: translate(locale, messageKey), messageKey };
  }

  const formData = await request.formData();
  const apiKey = formData.has("api_key") ? String(formData.get("api_key")).trim() : undefined;

  if (apiKey === undefined) {
    log.warn("auth", "Request made without API key");
    log.warn(
      "auth",
      "If this is unexpected, ensure your reverse proxy (if applicable) is configured correctly",
    );
    return failure("login.error.required");
  }

  if (apiKey.length === 0) {
    log.warn("auth", "Request made with empty API key");
    log.warn(
      "auth",
      "If this is unexpected, ensure your reverse proxy (if applicable) is configured correctly",
    );
    return failure("login.error.required");
  }

  // We need to make sure this is safe for HTTP headers
  if (!/^[\x21-\x7e]+$/.test(apiKey)) {
    return failure("login.error.invalid");
  }

  // Build a client with the candidate API key the user just submitted, so the
  // GET /api/v1/apikey call below validates the key against Headscale itself.
  const api = headscale.client(apiKey);
  try {
    const apiKeys = await api.apiKeys.list();

    // We don't need to check for 0 API keys because this request cannot
    // be authenticated correctly without an API key
    //
    // 0.28.0 pointlessly added asterisks to the prefixes of API keys, which is
    // the dumbest thing I've ever seen.
    const lookup = apiKeys.find((key) => apiKey.startsWith(key.prefix.replaceAll("*", "")));
    if (!lookup) {
      return failure("login.error.notFound");
    }

    if (lookup.expiration === null || lookup.expiration === undefined) {
      log.error("auth", "Got an API key without an expiration");
      return failure("login.error.noExpiration");
    }

    const expiry = new Date(lookup.expiration);
    if (expiry.getTime() < Date.now()) {
      return failure("login.error.expired");
    }

    return redirect("/machines", {
      headers: {
        "Set-Cookie": await auth.createApiKeySession(
          apiKey,
          `${lookup.prefix}...`,
          expiry.getTime() - Date.now(),
        ),
      },
    });
  } catch (error) {
    // Check if this is a React Router DataWithResponseInit wrapping a Headscale API error
    if (isDataWithApiError(error)) {
      const apiError = error.data;
      // TODO: What in gods name is wrong with the headscale API?
      if (
        apiError.statusCode === 401 ||
        apiError.statusCode === 403 ||
        (apiError.statusCode === 500 && apiError.rawData.trim() === "Unauthorized")
      ) {
        return failure("login.error.invalid");
      }
    }

    log.error(
      "auth",
      "Error while validating API key: %s",
      headscaleErrorMessage(error) ?? String(error),
    );
    log.debug("auth", "Error details: %o", error);
    return failure("login.error.unavailable");
  }
}
