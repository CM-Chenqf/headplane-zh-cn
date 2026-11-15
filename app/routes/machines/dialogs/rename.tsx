import { type } from "arktype";

import Code from "~/components/code";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";
import { useI18n, Message } from "~/i18n/provider";
import type { Machine } from "~/types";

const renameSchema = type({
  name: "string > 0",
});

const dnsLabelPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

interface RenameProps {
  machine: Machine;
  isOpen: boolean;
  magic?: string;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Rename({ machine, magic, isOpen, setIsOpen }: RenameProps) {
  const { t } = useI18n();
  function validateMachineName(values: Record<string, unknown>) {
    const name = String(values.name ?? "").toLowerCase();
    if (!dnsLabelPattern.test(name)) {
      return {
        name: t("machines.validation.name"),
      };
    }
  }
  const form = useForm({
    schema: renameSchema,
    defaultValues: { name: machine.givenName },
    validate: validateMachineName,
  });
  const name = form.values.name as string;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel isDisabled={!form.canSubmit}>
        <Title>{t("machines.renameTitle", { name: machine.givenName })}</Title>
        <Text className="mb-6">{t("machines.renameDescription")}</Text>
        <input name="action_id" type="hidden" value="rename" />
        <input name="node_id" type="hidden" value={machine.id} />
        <Input
          {...form.field("name")}
          errorMessage={
            form.errors.name
              ? name.length
                ? t("machines.validation.name")
                : t("validation.required")
              : undefined
          }
          required
          label={t("machines.machineName")}
          placeholder={t("machines.machineName")}
        />
        {magic ? (
          name.length > 0 && name !== machine.givenName ? (
            <p className="mt-2 text-sm leading-tight text-mist-600 dark:text-mist-300">
              <Message
                id="machines.willBeReachable"
                values={{
                  newName: (
                    <Code className="text-sm">{name.toLowerCase().replaceAll(/\s+/g, "-")}</Code>
                  ),
                  oldName: <Code className="text-sm">{machine.givenName}</Code>,
                }}
              />
            </p>
          ) : (
            <p className="mt-2 text-sm leading-tight text-mist-600 dark:text-mist-300">
              <Message
                id="machines.reachable"
                values={{ name: <Code className="text-sm">{machine.givenName}</Code> }}
              />
            </p>
          )
        ) : undefined}
      </DialogPanel>
    </Dialog>
  );
}
