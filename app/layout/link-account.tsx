import { useId } from "react";
import { Form } from "react-router";

import Button from "~/components/button";
import Card from "~/components/card";
import { useI18n } from "~/i18n/provider";
import { useNativeValidation } from "~/routes/users/use-native-validation";
import cn from "~/utils/cn";

interface LinkAccountProps {
  headscaleUsers: { id: string; name: string }[];
}

export default function LinkAccount({ headscaleUsers }: LinkAccountProps) {
  const { t } = useI18n();
  const errorId = useId();
  const validation = useNativeValidation();
  const { invalid, errorMessage, ...validationEvents } = validation.field<HTMLSelectElement>(
    "headscale_user_id",
    "users.validation.headscaleUser",
  );
  return (
    <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center py-36">
      <Card variant="flat" className="max-w-xl items-center gap-4">
        <Card.Title>{t("users.selfLink.title")}</Card.Title>
        <Card.Text>{t("users.selfLink.description")}</Card.Text>
        <Form method="POST" className="mt-4">
          <select
            {...validationEvents}
            aria-invalid={invalid || undefined}
            aria-describedby={errorMessage ? errorId : undefined}
            className={cn(
              "mb-4 w-full rounded-lg border p-2",
              "border-mist-200 dark:border-mist-700",
              "bg-mist-50 dark:bg-mist-900",
            )}
            aria-label={t("users.selfLink.select")}
            name="headscale_user_id"
            required
          >
            <option value="">{t("users.selfLink.select")}</option>
            {headscaleUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {errorMessage && (
            <p id={errorId} className="mb-2 text-xs text-red-500 dark:text-red-400">
              {errorMessage}
            </p>
          )}
          <Button className="w-full" type="submit" variant="heavy">
            {t("users.selfLink.submit")}
          </Button>
        </Form>
        <Card.Text className="mt-8 text-center text-xs text-mist-600 dark:text-mist-300">
          {t("users.selfLink.hint")}
        </Card.Text>
      </Card>
    </div>
  );
}
