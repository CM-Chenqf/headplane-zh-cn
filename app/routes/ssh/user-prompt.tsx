import { Form } from "react-router";

import Button from "~/components/button";
import Card from "~/components/card";
import Input from "~/components/input";
import Link from "~/components/link";
import { Message, useI18n } from "~/i18n/provider";

import { useNativeValidation } from "../users/use-native-validation";

interface UserPromptProps {
  hostname: string;
}

export default function UserPrompt({ hostname }: UserPromptProps) {
  const { t } = useI18n();
  const validation = useNativeValidation();
  return (
    <div className="flex h-screen items-center justify-center">
      <Card>
        <Card.Title>{t("ssh.prompt.title", { hostname })}</Card.Title>
        <Card.Text className="mb-4">
          {t("ssh.prompt.description")}
          <br />
          <br />
          <Message
            id="ssh.prompt.troubleshooting"
            values={{
              link: (
                <Link external styled to="https://headplane.net/features/ssh#troubleshooting">
                  {t("ssh.prompt.troubleshootingLink")}
                </Link>
              ),
            }}
          />
        </Card.Text>
        <Form
          method="GET"
          onSubmit={(e) => {
            const formData = new FormData(e.currentTarget);
            const username = formData.get("user");
            if (!username) {
              e.preventDefault();
              return;
            }

            // We have to do a full navigation, since the page needs a full
            // reload to initialize the SSH connection due to us disabling the
            // revalidator.
            const url = new URL(window.location.href);
            url.searchParams.set("user", username.toString());
            window.location.assign(url.toString());
          }}
        >
          <Input
            {...validation.field("user", "validation.required")}
            labelHidden
            type="text"
            label={t("ssh.prompt.username")}
            name="user"
            placeholder={t("ssh.prompt.username")}
            className="mb-2"
            required
          />
          <Button type="submit" variant="heavy" className="w-full">
            {t("ssh.prompt.connect")}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
