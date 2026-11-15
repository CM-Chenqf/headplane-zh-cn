import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useI18n } from "~/i18n/provider";
import { USERNAME_PATTERN } from "~/utils/user";

import { useNativeValidation } from "../use-native-validation";

interface CreateUserProps {
  isOidc?: boolean;
  isDisabled?: boolean;
}

export default function CreateUser({ isOidc, isDisabled }: CreateUserProps) {
  const { t } = useI18n();
  const validation = useNativeValidation();
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) validation.reset();
      }}
    >
      <Button disabled={isDisabled}>{t("users.add")}</Button>
      <DialogPanel>
        <Title>{t("users.createTitle")}</Title>
        <Text className="mb-6">
          {t(isOidc ? "users.createOidcDescription" : "users.createDescription")}
        </Text>
        <input name="action_id" type="hidden" value="create_user" />
        <div className="flex flex-col gap-4">
          <Input
            {...validation.field("username", "users.validation.usernameRule")}
            description={t("users.validation.usernameRule")}
            minLength={2}
            pattern={USERNAME_PATTERN}
            required
            title={t("users.validation.usernameRule")}
            label={t("users.username")}
            name="username"
            placeholder={t("users.usernamePlaceholder")}
            type="text"
          />
          <Input
            label={t("users.displayName")}
            name="display_name"
            placeholder={t("users.displayNamePlaceholder")}
            type="text"
          />
          <Input
            {...validation.field("email", "users.validation.email")}
            label={t("users.email")}
            name="email"
            placeholder="name@example.com"
            type="email"
          />
        </div>
      </DialogPanel>
    </Dialog>
  );
}
