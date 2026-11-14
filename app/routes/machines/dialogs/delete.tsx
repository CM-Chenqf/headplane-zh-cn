import ActionDialog from "~/components/action-dialog";
import { useI18n } from "~/i18n/provider";
import type { Machine } from "~/types";

interface DeleteProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Delete({ machine, isOpen, setIsOpen }: DeleteProps) {
  const { t } = useI18n();
  return (
    <ActionDialog
      description={t("machines.removeDescription")}
      fields={{ node_id: machine.id }}
      intent="delete"
      isDestructive
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("common.remove")}
      title={t("machines.removeTitle", { name: machine.givenName })}
    />
  );
}
