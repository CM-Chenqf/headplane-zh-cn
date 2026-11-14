import ActionDialog from "~/components/action-dialog";
import Section, { RemoveButton, Row, RowList } from "~/components/section";
import { useI18n } from "~/i18n/provider";

import AddRestriction from "./dialogs/add-restriction";
import type { RestrictionType } from "./schemas";

interface Props {
  type: RestrictionType;
  values: string[];
  isDisabled: boolean;
}

export default function RestrictionSection({ type, values, isDisabled }: Props) {
  const { t } = useI18n();

  return (
    <Section
      action={isDisabled ? undefined : <AddRestriction type={type} />}
      description={t(`restrictions.${type}.description`)}
      title={t(`restrictions.${type}.title`)}
    >
      {values.length === 0 ? (
        <p className="text-muted py-2.5 text-sm">{t(`restrictions.${type}.empty`)}</p>
      ) : (
        <RowList>
          {values.map((value) => (
            <Row
              action={
                <ActionDialog
                  description={t(`restrictions.${type}.removeDescription`)}
                  fields={{ type, value }}
                  intent="remove"
                  isDestructive
                  submitLabel={t("common.remove")}
                  title={t("restrictions.removeTitle", { value })}
                  trigger={<RemoveButton disabled={isDisabled} />}
                />
              }
              key={value}
            >
              <span className="font-mono text-xs break-all">{value}</span>
            </Row>
          ))}
        </RowList>
      )}
    </Section>
  );
}
