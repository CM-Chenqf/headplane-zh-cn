import { Link as RouterLink } from "react-router";

import Button from "~/components/button";
import { useI18n } from "~/i18n/provider";
import { localizeSSHError, type SSHErrorDetails } from "~/i18n/ssh";
import Shell from "~/routes/auth/login/shell";

export { isSSHError, sshErrors } from "~/i18n/ssh";

export const SSH_DOCS_URL = "https://headplane.net/features/ssh";

export function SSHError(error: SSHErrorDetails) {
  const { locale, t } = useI18n();
  const { title, message, anchor } = localizeSSHError(error, locale);
  return (
    <Shell description={message} title={title}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          nativeButton={false}
          render={<a href={`${SSH_DOCS_URL}${anchor}`} rel="noreferrer" target="_blank" />}
          variant="primary"
        >
          {t("ssh.docs")}
        </Button>
        <Button nativeButton={false} render={<RouterLink reloadDocument to="/" />}>
          {t("ssh.return")}
        </Button>
      </div>
    </Shell>
  );
}
