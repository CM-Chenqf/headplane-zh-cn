import ActionDialog from "~/components/action-dialog";
import { useI18n } from "~/i18n/provider";
import { KEY_EXPIRY_DAYS } from "~/server/headscale/api/resources/nodes";
import type { Machine } from "~/types";
import { isNoExpiry } from "~/utils/node-info";

interface KeyExpiryProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function KeyExpiry({ machine, isOpen, setIsOpen }: KeyExpiryProps) {
  const { t } = useI18n();
  const isDisabling = !isNoExpiry(machine.expiry);

  return (
    <ActionDialog
      description={
        isDisabling
          ? t("machines.disableExpiryDescription")
          : t("machines.enableExpiryDescription", { days: KEY_EXPIRY_DAYS })
      }
      fields={{ node_id: machine.id, disable_expiry: String(isDisabling) }}
      intent="toggle_expiry"
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t(isDisabling ? "machines.disableExpiry" : "machines.enableExpiry")}
      title={t(isDisabling ? "machines.disableExpiryTitle" : "machines.enableExpiryTitle", {
        name: machine.givenName,
      })}
    />
  );
}
