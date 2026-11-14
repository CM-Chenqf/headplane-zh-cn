import ActionDialog from "~/components/action-dialog";
import Input from "~/components/input";
import { useI18n } from "~/i18n/provider";
import type { User } from "~/types";
import { fieldValidator } from "~/utils/form";

import { usernameSchema } from "../schemas";

interface RenameProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function RenameUser({ user, isOpen, setIsOpen }: RenameProps) {
  const { locale, t } = useI18n();
  const validateUsername = fieldValidator(usernameSchema(locale));
  return (
    <ActionDialog
      description={t("users.renameDescription")}
      fields={{ headscale_user_id: user.id }}
      intent="rename"
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("users.rename")}
      title={t("users.renameTitle", { name: user.name || user.displayName || user.id })}
    >
      <Input
        defaultValue={user.name}
        description={t("users.validation.usernameRule")}
        label={t("users.username")}
        name="name"
        required
        validate={validateUsername}
      />
    </ActionDialog>
  );
}
