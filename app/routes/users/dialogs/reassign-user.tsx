import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Link from "~/components/link";
import RadioGroup from "~/components/radio-group";
import { Message, useI18n } from "~/i18n/provider";
import { Roles } from "~/server/web/roles";
import type { Role } from "~/server/web/roles";

interface ReassignProps {
  headplaneUserId: string;
  displayName: string;
  role: Role;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ReassignUser({
  headplaneUserId,
  displayName,
  role,
  isOpen,
  setIsOpen,
}: ReassignProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string>(role);

  return (
    <ActionDialog
      description={
        <Message
          id="users.roleDescription"
          values={{
            docs: (
              <Link external styled to="https://tailscale.com/kb/1138/user-roles">
                {t("common.docs")}
              </Link>
            ),
          }}
        />
      }
      fields={{ headplane_user_id: headplaneUserId }}
      intent="reassign"
      isDisabled={selected === role}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("users.changeRole")}
      title={t("users.changeRoleTitle", { name: displayName })}
    >
      <RadioGroup
        className="gap-4"
        label={t("users.role")}
        name="role"
        onValueChange={setSelected}
        value={selected}
      >
        {(Object.keys(Roles) as Role[])
          .filter((r) => r !== "owner")
          .map((r) => {
            const name = t(`users.role.${r}`);
            const desc = t(`users.roleDescription.${r}`);
            return (
              <RadioGroup.Radio key={r} label={name} value={r}>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-muted">{desc}</p>
                </div>
              </RadioGroup.Radio>
            );
          })}
      </RadioGroup>
    </ActionDialog>
  );
}
