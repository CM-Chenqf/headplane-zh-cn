import { type } from "arktype";

import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";
import { useI18n } from "~/i18n/provider";

const domainSchema = type({
  domain: "string > 0",
});

interface AddDomainProps {
  domains: string[];
  isDisabled?: boolean;
}

export default function AddDomain({ domains, isDisabled }: AddDomainProps) {
  const { t } = useI18n();
  const form = useForm({
    schema: domainSchema,
    localizeError: (_name, error) =>
      t(
        error === "restrictions.domain.duplicate"
          ? "restrictions.domain.duplicate"
          : error === "restrictions.domain.invalid"
            ? "restrictions.domain.invalid"
            : "validation.required",
      ),
    validate: (values) => {
      const domain = (values.domain as string).trim();
      if (domain.length === 0) return undefined;

      if (domains.includes(domain)) {
        return { domain: "restrictions.domain.duplicate" };
      }

      try {
        const url = new URL(`http://${domain}`);
        if (url.hostname !== domain) {
          return { domain: "restrictions.domain.invalid" };
        }
      } catch {
        return { domain: "restrictions.domain.invalid" };
      }

      return undefined;
    },
  });
  const domain = (form.values.domain as string).trim();

  return (
    <Dialog>
      <Button disabled={isDisabled}>{t("restrictions.domain.add")}</Button>
      <DialogPanel>
        <Title>{t("restrictions.domain.add")}</Title>
        <Text className="mb-4">{t("restrictions.domain.description")}</Text>
        <input name="action_id" type="hidden" value="add_domain" />
        <Input
          {...form.field("domain")}
          description={
            domain.length > 0
              ? t("restrictions.domain.matches", { domain })
              : t("restrictions.domain.hint")
          }
          required
          label={t("restrictions.domain.label")}
          placeholder="example.com"
        />
      </DialogPanel>
    </Dialog>
  );
}
