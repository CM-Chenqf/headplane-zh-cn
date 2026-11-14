import ActionDialog from "~/components/action-dialog";
import Callout from "~/components/callout";
import { useI18n } from "~/i18n/provider";
import type { Machine, User } from "~/types";

interface DeleteProps {
  user: User;
  machines: Machine[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DeleteUser({ user, machines, isOpen, setIsOpen }: DeleteProps) {
  const { t } = useI18n();
  const hasMachines = machines.length > 0;

  return (
    <ActionDialog
      description={t(
        user.provider === "oidc" ? "users.deleteOidcDescription" : "users.deleteDescription",
      )}
      fields={{ headscale_user_id: user.id }}
      intent="delete"
      isDestructive
      isDisabled={hasMachines}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("users.delete")}
      title={t("users.deleteTitle", { name: user.name || user.displayName || user.id })}
    >
      {hasMachines && <Callout variant="warning">{t("users.deleteMachines")}</Callout>}
    </ActionDialog>
  );
}
