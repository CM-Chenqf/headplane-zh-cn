import ActionDialog from "~/components/action-dialog";
import { RemoveButton } from "~/components/section";
import { useI18n } from "~/i18n/provider";
import type { PreAuthKey, User } from "~/types";

interface ExpireAuthKeyProps {
  authKey: PreAuthKey;
  user: User;
}

export default function ExpireAuthKey({ authKey, user }: ExpireAuthKeyProps) {
  const { t } = useI18n();
  return (
    <ActionDialog
      description={t("authKeys.expireDescription")}
      fields={{ key_id: authKey.id, user_id: user.id }}
      intent="expire"
      isDestructive
      submitLabel={t("authKeys.expireKey")}
      title={t("authKeys.expireTitle")}
      trigger={<RemoveButton>{t("authKeys.expire")}</RemoveButton>}
    />
  );
}
