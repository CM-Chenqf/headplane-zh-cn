import Callout from "~/components/callout";
import Code from "~/components/code";
import { Message, useI18n } from "~/i18n/provider";

export function OidcErrorNotice({ code }: { code: string }) {
  const { t } = useI18n();
  return (
    <Callout className="mb-6" title={t("oidc.failedTitle")} variant="error">
      <p>
        <OidcErrorMessage code={code} />
      </p>
    </Callout>
  );
}

function OidcErrorMessage({ code }: { code: string }) {
  const { t } = useI18n();
  switch (code) {
    case "error_no_query":
      return t("oidc.noQuery");

    case "error_no_session":
    case "error_invalid_session":
      return t("oidc.noSession");

    case "error_no_sub":
      return <Message id="oidc.noSubject" values={{ claim: <Code>sub</Code> }} />;

    case "error_auth_failed":
      return t("oidc.authFailed");

    default:
      return t("oidc.unknown");
  }
}
