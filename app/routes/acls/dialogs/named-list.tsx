import { useEffect, useState } from "react";

import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import TokenList from "~/components/token-list";
import { useI18n } from "~/i18n/provider";
import { isValidGroupName, isValidTagName } from "~/utils/acl-policy";

export type NamedListKind = "group" | "tag";

interface NamedListDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  kind: NamedListKind;
  // Present when editing, absent when creating a new entry.
  name?: string;
  members?: string[];
  existingNames: string[];
  suggestions: string[];
  onSave: (name: string, members: string[]) => void;
}

const COPY = {
  group: {
    prefix: "group:",
    placeholder: "alice@",
    validate: isValidGroupName,
  },
  tag: {
    prefix: "tag:",
    placeholder: "group:ops",
    validate: isValidTagName,
  },
} as const;

export default function NamedListDialog({
  isOpen,
  setIsOpen,
  kind,
  name,
  members,
  existingNames,
  suggestions,
  onSave,
}: NamedListDialogProps) {
  const { t } = useI18n();
  const copy = COPY[kind];
  const [draftName, setDraftName] = useState(name ?? copy.prefix);
  const [draftMembers, setDraftMembers] = useState<string[]>(members ?? []);

  useEffect(() => {
    if (isOpen) {
      setDraftName(name ?? copy.prefix);
      setDraftMembers(members ? [...members] : []);
    }
  }, [isOpen, name, members, copy.prefix]);

  const trimmedName = draftName.trim();
  const isDuplicate = trimmedName !== name && existingNames.includes(trimmedName);
  const nameIsInvalid = !copy.validate(trimmedName) || isDuplicate;
  // The field opens pre-filled with the `group:`/`tag:` prefix, which is not a
  // valid name yet. Saving stays blocked, but nothing is flagged until it is edited.
  const isPristine = trimmedName.length === 0 || trimmedName === copy.prefix;
  const showNameError = !isPristine && nameIsInvalid;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel
        isDisabled={nameIsInvalid}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(trimmedName, draftMembers);
          setIsOpen(false);
        }}
      >
        <Title>{name ? t(`acls.${kind}.edit`, { name }) : t(`acls.${kind}.new`)}</Title>
        <Text>{t(`acls.${kind}.hint`)}</Text>
        <Input
          errorMessage={t(isDuplicate ? `acls.${kind}.duplicate` : `acls.${kind}.hint`)}
          invalid={showNameError}
          label={t("acls.name")}
          onChange={setDraftName}
          placeholder={`${copy.prefix}example`}
          value={draftName}
        />
        <TokenList
          description={t(`acls.${kind}.membersDescription`)}
          emptyText={t(`acls.${kind}.empty`)}
          label={t(`acls.${kind}.members`)}
          onChange={setDraftMembers}
          placeholder={copy.placeholder}
          suggestions={suggestions}
          values={draftMembers}
        />
      </DialogPanel>
    </Dialog>
  );
}
