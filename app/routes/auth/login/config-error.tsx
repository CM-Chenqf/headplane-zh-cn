import Callout from "~/components/callout";
import Code from "~/components/code";
import Link from "~/components/link";
import { Message, useI18n } from "~/i18n/provider";
import type { OidcErrorCode } from "~/server/oidc/provider";

export function OidcDiscoveryFailedNotice() {
  const { t } = useI18n();
  return (
    <Callout className="mb-6" title={t("oidc.unavailableTitle")} variant="warning">
      {t("oidc.unavailable")}
    </Callout>
  );
}

export function OidcConfigErrorNotice({ errors }: { errors: OidcErrorCode[] }) {
  const { t } = useI18n();
  return (
    <Callout className="mb-6" title={t("oidc.configTitle")} variant="error">
      <ul className="list-inside list-disc">
        {errors.map((code) => (
          <li key={code}>
            <OidcConfigMessage code={code} />
          </li>
        ))}
      </ul>
      <Link external styled to="https://headplane.net/features/sso#troubleshooting">
        {t("common.troubleshooting")}
      </Link>
    </Callout>
  );
}

function OidcConfigMessage({ code }: { code: OidcErrorCode }) {
  const { t } = useI18n();
  switch (code) {
    case "invalid_api_key":
      return (
        <Message id="oidc.invalidApiKey" values={{ setting: <Code>headscale.api_key</Code> }} />
      );
    case "missing_endpoints":
      return t("oidc.missingEndpoints");
    case "discovery_failed":
      return t("oidc.discoveryFailed");
    default:
      return t("oidc.configUnknown");
  }
}
