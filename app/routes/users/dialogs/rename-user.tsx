import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useI18n } from "~/i18n/provider";
import { User } from "~/types";
import { USERNAME_PATTERN } from "~/utils/user";

import { useNativeValidation } from "../use-native-validation";

interface RenameProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function RenameUser({ user, isOpen, setIsOpen }: RenameProps) {
  const { t } = useI18n();
  const validation = useNativeValidation();
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel>
        <Title>{t("users.renameTitle", { name: user.name || user.displayName || user.id })}</Title>
        <Text className="mb-6">
          {t("users.renameDescription", { name: user.name || user.displayName || user.id })}
        </Text>
        <input name="action_id" type="hidden" value="rename_user" />
        <input name="headscale_user_id" type="hidden" value={user.id} />
        <Input
          {...validation.field("new_name", "users.validation.usernameRule")}
          defaultValue={user.name}
          description={t("users.validation.usernameRule")}
          minLength={2}
          pattern={USERNAME_PATTERN}
          required
          title={t("users.validation.usernameRule")}
          label={t("users.username")}
          name="new_name"
          placeholder={t("users.newNamePlaceholder")}
        />
      </DialogPanel>
    </Dialog>
  );
}
