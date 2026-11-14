import { useState } from "react";

import Input from "~/components/input";
import { useI18n } from "~/i18n/provider";
import { isValidHostName } from "~/utils/acl-policy";

import EditorDialog from "./editor-dialog";

interface HostDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  name?: string;
  value?: string;
  existingNames: string[];
  onSave: (name: string, value: string) => void;
}

export default function HostDialog({
  isOpen,
  setIsOpen,
  name,
  value,
  existingNames,
  onSave,
}: HostDialogProps) {
  const { t } = useI18n();
  const [draftName, setDraftName] = useState(name ?? "");
  const [draftValue, setDraftValue] = useState(value ?? "");

  const isDuplicate = draftName !== name && existingNames.includes(draftName);
  const nameIsInvalid = !isValidHostName(draftName) || isDuplicate;
  const valueIsInvalid = draftValue.trim().length === 0;

  return (
    <EditorDialog
      description={t("acls.hostDescription")}
      isDisabled={nameIsInvalid || valueIsInvalid}
      isOpen={isOpen}
      onSubmit={() => onSave(draftName, draftValue.trim())}
      setIsOpen={setIsOpen}
      submitLabel={t(name ? "acls.updateHost" : "acls.addHost")}
      title={name ? t("acls.editHost", { name }) : t("acls.newHost")}
    >
      <Input
        errorMessage={isDuplicate ? t("acls.duplicateHost") : t("acls.invalidHost")}
        invalid={draftName.length > 0 && nameIsInvalid}
        label={t("acls.name")}
        onChange={setDraftName}
        placeholder={t("acls.hostPlaceholder")}
        value={draftName}
      />
      <Input
        invalid={draftValue.length > 0 && valueIsInvalid}
        label={t("acls.address")}
        onChange={setDraftValue}
        placeholder="100.64.0.0/24"
        value={draftValue}
      />
    </EditorDialog>
  );
}
