import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";
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
  const name = user.name || user.displayName;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel variant={machines.length > 0 ? "unactionable" : "normal"}>
        <Title>{t("users.deleteTitle", { name: name || user.id })}</Title>
        {machines.length > 0 ? (
          <Text className="mb-6">{t("users.deleteMachines")}</Text>
        ) : (
          <Text className="mb-6">
            {t("users.deleteDescription")}
            {user.provider === "oidc" && (
              <span className="mt-4 block text-sm text-mist-600 dark:text-mist-300">
                {t("users.deleteOidcNotice")}
              </span>
            )}
          </Text>
        )}
        <input name="action_id" type="hidden" value="delete_user" />
        <input name="headscale_user_id" type="hidden" value={user.id} />
      </DialogPanel>
    </Dialog>
  );
}
