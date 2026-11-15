import { AlertCircle } from "lucide-react";

import Card from "~/components/card";
import Link from "~/components/link";
import { useI18n } from "~/i18n/provider";
import { localizeSSHError } from "~/i18n/ssh";

export { isSSHError, sshErrors } from "~/i18n/ssh";

interface SSHErrorBoundaryProps {
  title: string;
  message: string;
  anchor: string;
  code?: string;
  hostname?: string;
}

const DOCS_BASE = "https://headplane.net/features/ssh";

export function SSHErrorBoundary({ title, message, anchor, ...metadata }: SSHErrorBoundaryProps) {
  const { locale, t } = useI18n();
  const localized = localizeSSHError({ title, message, anchor, ...metadata }, locale);
  return (
    <Card className="w-screen" variant="flat">
      <div className="flex items-center justify-between gap-4">
        <Card.Title>{localized.title}</Card.Title>
        <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
      </div>
      <Card.Text>
        {localized.message}
        <br />
        <br />
        <Link to={`${DOCS_BASE}${anchor}`} external styled>
          {t("ssh.docs")}
        </Link>{" "}
      </Card.Text>
    </Card>
  );
}
