import { Form as ValidatedForm } from "@base-ui/react/form";
import { Form } from "react-router";

import Button from "~/components/button";
import Input from "~/components/input";
import Link from "~/components/link";
import { Message, useI18n } from "~/i18n/provider";
import Shell from "~/routes/auth/login/shell";

import { SSH_DOCS_URL } from "./errors";

interface UserPromptProps {
  hostname: string;
}

export default function UserPrompt({ hostname }: UserPromptProps) {
  const { t } = useI18n();
  return (
    <Shell description={t("ssh.prompt.description")} title={t("ssh.prompt.title", { hostname })}>
      <ValidatedForm
        className="flex flex-col gap-3"
        render={<Form method="GET" />}
        onSubmit={(e) => {
          const formData = new FormData(e.currentTarget);
          const username = formData.get("user");
          if (!username) {
            e.preventDefault();
            return;
          }

          // The page needs a full reload to start the SSH connection, since
          // revalidation is disabled for this route.
          e.preventDefault();
          const url = new URL(window.location.href);
          url.searchParams.set("user", username.toString());
          window.location.assign(url.toString());
        }}
      >
        <Input
          autoComplete="off"
          label={t("ssh.prompt.username")}
          name="user"
          required
          spellCheck={false}
        />
        <Button className="w-full" type="submit" variant="primary">
          {t("ssh.prompt.connect")}
        </Button>
      </ValidatedForm>
      <p className="text-muted mt-6 text-sm">
        <Message
          id="ssh.prompt.troubleshooting"
          values={{
            link: (
              <Link external styled to={`${SSH_DOCS_URL}#troubleshooting`}>
                {t("ssh.prompt.troubleshootingLink")}
              </Link>
            ),
          }}
        />
      </p>
    </Shell>
  );
}
