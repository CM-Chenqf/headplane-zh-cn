import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Code from "~/components/code";
import Input from "~/components/input";
import { Message, useI18n } from "~/i18n/provider";
import type { Machine } from "~/types";
import { fieldValidator } from "~/utils/form";

import { machineNameSchema } from "../schemas";

interface RenameProps {
  machine: Machine;
  isOpen: boolean;
  magic?: string;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Rename({ machine, magic, isOpen, setIsOpen }: RenameProps) {
  const { locale, t } = useI18n();
  const validateName = fieldValidator(machineNameSchema(locale));
  const [name, setName] = useState(machine.givenName);
  const isValid = validateName(name) === null;

  return (
    <ActionDialog
      description={t("machines.renameDescription")}
      fields={{ node_id: machine.id }}
      intent="rename"
      isDisabled={name === machine.givenName}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("machines.rename")}
      title={t("machines.renameTitle", { name: machine.givenName })}
    >
      <Input
        defaultValue={machine.givenName}
        label={t("machines.machineName")}
        name="name"
        onChange={setName}
        required
        validate={validateName}
      />
      {magic && isValid && (
        <p className="text-muted">
          {name === machine.givenName ? (
            <Message id="machines.reachable" values={{ name: <Code>{machine.givenName}</Code> }} />
          ) : (
            <Message
              id="machines.willBeReachable"
              values={{
                newName: <Code>{name.toLowerCase()}</Code>,
                oldName: <Code>{machine.givenName}</Code>,
              }}
            />
          )}
        </p>
      )}
    </ActionDialog>
  );
}
