import { Plus } from "lucide-react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { useI18n } from "~/i18n/provider";
import { fieldValidator } from "~/utils/form";

import { usernameSchema } from "../schemas";

interface CreateUserProps {
  isOidc?: boolean;
  isDisabled?: boolean;
}

export default function CreateUser({ isOidc, isDisabled }: CreateUserProps) {
  const { locale, t } = useI18n();
  const validateUsername = fieldValidator(usernameSchema(locale));
  return (
    <ActionDialog
      description={t(isOidc ? "users.createOidcDescription" : "users.createDescription")}
      intent="create"
      submitLabel={t("users.create")}
      title={t("users.createTitle")}
      trigger={
        <Button disabled={isDisabled} variant="primary">
          <Plus className="size-3.5" />
          {t("users.add")}
        </Button>
      }
    >
      <Input
        description={t("users.validation.usernameRule")}
        label={t("users.username")}
        name="name"
        placeholder={t("users.usernamePlaceholder")}
        required
        validate={validateUsername}
      />
      <Input
        label={t("users.displayName")}
        name="display_name"
        placeholder={t("users.displayNamePlaceholder")}
      />
      <Input label={t("users.email")} name="email" placeholder="name@example.com" type="email" />
    </ActionDialog>
  );
}
