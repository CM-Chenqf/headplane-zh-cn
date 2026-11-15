import Attribute from "~/components/attribute";
import { useI18n } from "~/i18n/provider";
import type { PreAuthKey, User } from "~/types";
import { getUserDisplayName } from "~/utils/user";

import ExpireAuthKey from "./dialogs/expire-auth-key";

interface Props {
  authKey: PreAuthKey;
  user: User | null;
}

export default function AuthKeyRow({ authKey, user }: Props) {
  const { locale, t } = useI18n();
  const createdAt = new Date(authKey.createdAt).toLocaleString(locale);
  const expiration = new Date(authKey.expiration).toLocaleString(locale);
  const isExpired =
    (authKey.used && !authKey.reusable) || new Date(authKey.expiration) < new Date();
  const userDisplay = user ? getUserDisplayName(user, locale) : t("authKeys.tagOnly");

  return (
    <div className="w-full">
      <Attribute name={t("authKeys.key")} value={authKey.key} />
      <Attribute name={t("authKeys.user")} value={userDisplay} />
      <Attribute
        name={t("authKeys.reusable")}
        value={authKey.reusable ? t("common.yes") : t("common.no")}
      />
      <Attribute
        name={t("authKeys.ephemeral")}
        value={authKey.ephemeral ? t("common.yes") : t("common.no")}
      />
      <Attribute
        name={t("authKeys.used")}
        value={authKey.used ? t("common.yes") : t("common.no")}
      />
      <Attribute name={t("authKeys.created")} value={createdAt} suppressHydrationWarning />
      <Attribute name={t("authKeys.expiration")} value={expiration} suppressHydrationWarning />
      {!isExpired && user && (
        <div className="mt-2" suppressHydrationWarning>
          <ExpireAuthKey authKey={authKey} user={user} />
        </div>
      )}
    </div>
  );
}
