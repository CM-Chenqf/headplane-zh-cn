import { AlertCircle } from "lucide-react";

import Card from "~/components/card";
import Code from "~/components/code";
import { Message, useI18n } from "~/i18n/provider";

export function OidcErrorNotice({ code }: { code: string }) {
  const { t } = useI18n();
  return (
    <Card className="mb-4 max-w-md border border-red-500">
      <div className="flex items-center justify-between gap-4">
        <Card.Title className="text-red-500">{t("login.configurationIssues")}</Card.Title>
        <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
      </div>
      {getErrorMessage(code)}
    </Card>
  );
}

function getErrorMessage(code: string) {
  switch (code) {
    case "error_no_query":
      return (
        <Card.Text>
          <Message id="oidc.noQuery" values={{}} />
        </Card.Text>
      );

    case "error_no_session":
    case "error_invalid_session":
      return (
        <Card.Text>
          <Message id="oidc.noSession" values={{}} />
        </Card.Text>
      );

    case "error_no_sub":
      return (
        <Card.Text>
          <Message id="oidc.noSubject" values={{ claim: <Code>sub</Code> }} />
        </Card.Text>
      );

    case "error_auth_failed":
      return (
        <Card.Text>
          <Message id="oidc.authFailed" values={{}} />
        </Card.Text>
      );

    default:
      return (
        <Card.Text>
          <Message id="oidc.unknown" values={{}} />
        </Card.Text>
      );
  }
}
