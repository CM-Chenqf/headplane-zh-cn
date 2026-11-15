import { Plus } from "lucide-react";
import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { useI18n } from "~/i18n/provider";
import { fieldValidator } from "~/utils/form";

import { type RestrictionType, restrictionSchemas } from "../schemas";

const placeholders = { domain: "example.com", group: "admin", user: "john_doe" };

interface AddRestrictionProps {
  type: RestrictionType;
}

export default function AddRestriction({ type }: AddRestrictionProps) {
  const { locale, t } = useI18n();
  const [value, setValue] = useState("");
  const title = t(`restrictions.${type}.add`);
  const domain = value.trim();

  return (
    <ActionDialog
      description={t(`restrictions.${type}.addDescription`)}
      fields={{ type }}
      intent="add"
      submitLabel={title}
      title={title}
      trigger={
        <Button>
          <Plus className="size-3.5" />
          {title}
        </Button>
      }
    >
      <Input
        description={
          type === "domain" && domain.length > 0 ? t("restrictions.matches", { domain }) : undefined
        }
        label={t(`restrictions.${type}.label`)}
        name="value"
        onChange={setValue}
        placeholder={placeholders[type]}
        required
        validate={fieldValidator(restrictionSchemas(locale)[type])}
      />
    </ActionDialog>
  );
}
