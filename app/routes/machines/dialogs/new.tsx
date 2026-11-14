import { Computer, FileKey2, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import ActionDialog from "~/components/action-dialog";
import CodeBlock from "~/components/code-block";
import Input from "~/components/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "~/components/menu";
import Select from "~/components/select";
import { useI18n } from "~/i18n/provider";
import type { User } from "~/types";
import { normalizeRegistrationKey } from "~/utils/register-key";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

export interface NewMachineProps {
  server: string;
  users: User[];
  isDisabled?: boolean;
  disabledKeys?: string[];
}

export default function NewMachine(data: NewMachineProps) {
  const { t } = useI18n();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <ActionDialog
        description={t("machines.registerDescription")}
        intent="register"
        onOpenChange={setIsRegisterOpen}
        open={isRegisterOpen}
        submitLabel={t("machines.register")}
        title={t("machines.registerTitle")}
      >
        <CodeBlock>{`tailscale up --login-server=${data.server}`}</CodeBlock>
        <Input
          description={t("machines.registrationDescription")}
          label={t("machines.machineKey")}
          name="register_key"
          placeholder="hskey-authreq-XXXXXXXXXXXXXXXXXXXXXXXX"
          required
          validate={(value) =>
            normalizeRegistrationKey(String(value ?? ""))
              ? null
              : t("machines.validation.registrationKey")
          }
        />
        <Select
          items={sortUsersByDisplayName(data.users).map((user) => ({
            // Headscale's v1/node/register endpoint resolves the owner by
            // username via GetUserByName, so we must pass user.name (not id).
            value: user.name,
            label: getUserDisplayName(user),
          }))}
          label={t("machines.owner")}
          name="user"
          placeholder={t("machines.selectUser")}
          required
        />
      </ActionDialog>
      <Menu disabled={data.isDisabled}>
        <MenuTrigger className="bg-ink text-ink-fg hover:bg-ink/90 h-8 gap-1.5 rounded-md px-3 text-sm font-medium">
          <Plus className="size-3.5" />
          {t("machines.add")}
        </MenuTrigger>
        <MenuContent>
          <MenuItem
            disabled={data.disabledKeys?.includes("register")}
            onClick={() => setIsRegisterOpen(true)}
          >
            <div className="flex items-center gap-x-3">
              <Computer className="w-4" />
              {t("machines.registerKey")}
            </div>
          </MenuItem>
          <MenuItem
            disabled={data.disabledKeys?.includes("pre-auth")}
            onClick={() => navigate("/settings/auth-keys")}
          >
            <div className="flex items-center gap-x-3">
              <FileKey2 className="w-4" />
              {t("machines.createAuthKey")}
            </div>
          </MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}
