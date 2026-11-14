import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Select from "~/components/select";
import { useI18n } from "~/i18n/provider";
import type { Machine, User } from "~/types";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

interface MoveProps {
  machine: Machine;
  users: User[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Move({ machine, users, isOpen, setIsOpen }: MoveProps) {
  const { t } = useI18n();
  const [userId, setUserId] = useState(machine.user?.id ?? null);

  return (
    <ActionDialog
      description={t("machines.changeOwnerDescription")}
      fields={{ node_id: machine.id }}
      intent="reassign"
      isDisabled={!userId || userId === machine.user?.id}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("machines.changeOwner")}
      title={t("machines.changeOwnerTitle", { name: machine.givenName })}
    >
      <Select
        defaultValue={machine.user?.id ?? null}
        items={sortUsersByDisplayName(users).map((user) => ({
          value: user.id,
          label: getUserDisplayName(user),
        }))}
        label={t("machines.owner")}
        name="user_id"
        onValueChange={setUserId}
        placeholder={t("machines.selectUser")}
        required
      />
    </ActionDialog>
  );
}
