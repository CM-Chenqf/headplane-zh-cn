import { type } from "arktype";

import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";
import { useI18n } from "~/i18n/provider";

const userSchema = type({
  user: "string > 0",
});

interface AddUserProps {
  users: string[];
  isDisabled?: boolean;
}

export default function AddUser({ users, isDisabled }: AddUserProps) {
  const { t } = useI18n();
  const form = useForm({
    schema: userSchema,
    localizeError: (_name, error) =>
      t(
        error === "restrictions.user.duplicate"
          ? "restrictions.user.duplicate"
          : "validation.required",
      ),
    validate: (values) => {
      const user = (values.user as string).trim();
      if (user.length === 0) return undefined;

      if (users.includes(user)) {
        return { user: "restrictions.user.duplicate" };
      }

      return undefined;
    },
  });

  return (
    <Dialog>
      <Button disabled={isDisabled}>{t("restrictions.user.add")}</Button>
      <DialogPanel>
        <Title>{t("restrictions.user.add")}</Title>
        <Text className="mb-4">{t("restrictions.user.description")}</Text>
        <input name="action_id" type="hidden" value="add_user" />
        <Input
          {...form.field("user")}
          description={t("restrictions.user.hint")}
          required
          label={t("restrictions.user.label")}
          placeholder="john_doe"
        />
      </DialogPanel>
    </Dialog>
  );
}
