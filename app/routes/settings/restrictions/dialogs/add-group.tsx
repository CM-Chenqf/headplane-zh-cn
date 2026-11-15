import { type } from "arktype";

import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";
import { useI18n } from "~/i18n/provider";

const groupSchema = type({
  group: "string > 0",
});

interface AddGroupProps {
  groups: string[];
  isDisabled?: boolean;
}

export default function AddGroup({ groups, isDisabled }: AddGroupProps) {
  const { t } = useI18n();
  const form = useForm({
    schema: groupSchema,
    localizeError: (_name, error) =>
      t(
        error === "restrictions.group.duplicate"
          ? "restrictions.group.duplicate"
          : "validation.required",
      ),
    validate: (values) => {
      const group = (values.group as string).trim();
      if (group.length === 0) return undefined;

      if (groups.includes(group)) {
        return { group: "restrictions.group.duplicate" };
      }

      return undefined;
    },
  });

  return (
    <Dialog>
      <Button disabled={isDisabled}>{t("restrictions.group.add")}</Button>
      <DialogPanel>
        <Title>{t("restrictions.group.add")}</Title>
        <Text className="mb-4">{t("restrictions.group.description")}</Text>
        <input name="action_id" type="hidden" value="add_group" />
        <Input
          {...form.field("group")}
          description={t("restrictions.group.hint")}
          required
          label={t("restrictions.group.label")}
          placeholder="admin"
        />
      </DialogPanel>
    </Dialog>
  );
}
