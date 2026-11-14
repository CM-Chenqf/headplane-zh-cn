import ActionDialog from "~/components/action-dialog";
import { useI18n } from "~/i18n/provider";

interface TransferOwnershipProps {
  targetHeadplaneUserId: string;
  targetDisplayName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function TransferOwnership({
  targetHeadplaneUserId,
  targetDisplayName,
  isOpen,
  setIsOpen,
}: TransferOwnershipProps) {
  const { t } = useI18n();
  return (
    <ActionDialog
      description={t("users.transferDescription", { name: targetDisplayName })}
      fields={{ headplane_user_id: targetHeadplaneUserId }}
      intent="transfer"
      isDestructive
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("users.transfer")}
      title={t("users.transferTitle", { name: targetDisplayName })}
    />
  );
}
