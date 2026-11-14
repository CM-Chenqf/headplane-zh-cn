import ActionDialog from "~/components/action-dialog";
import Callout from "~/components/callout";
import Section, { RemoveButton, Row, RowList } from "~/components/section";
import { useI18n } from "~/i18n/provider";

import AddDomain from "../dialogs/add-domain";
import { useReorder } from "./reorder";

interface Props {
  searchDomains: string[];
  isDisabled: boolean;
  magic?: string;
}

export default function ManageDomains({ searchDomains, isDisabled, magic }: Props) {
  const { t } = useI18n();
  const reorder = useReorder("move_domain", "domain");
  const domains = reorder.order(searchDomains);

  return (
    <Section
      action={isDisabled ? undefined : <AddDomain />}
      description={t("dns.searchDescription")}
      title={t("dns.searchDomains")}
    >
      {reorder.error && (
        <Callout className="mb-3" variant="error">
          {reorder.error}
        </Callout>
      )}
      {!magic && domains.length === 0 ? (
        <p className="text-muted py-2.5 text-sm">{t("dns.noSearchDomains")}</p>
      ) : (
        <RowList>
          {magic && (
            <Row action={<span className="text-muted px-2">{t("dns.magic")}</span>}>
              <span className="font-mono text-xs break-all">{magic}</span>
            </Row>
          )}
          {domains.map((domain, index) => (
            <Row
              action={
                <div className="flex items-center gap-1">
                  {!isDisabled && reorder.controls(domains, index)}
                  <ActionDialog
                    description={t("dns.removeSearchDescription")}
                    fields={{ domain }}
                    intent="remove_domain"
                    isDestructive
                    submitLabel={t("common.remove")}
                    title={t("dns.removeSearchDomain", { domain })}
                    trigger={<RemoveButton disabled={isDisabled} />}
                  />
                </div>
              }
              className="group/row"
              key={domain}
            >
              <span className="font-mono text-xs break-all">{domain}</span>
            </Row>
          ))}
        </RowList>
      )}
    </Section>
  );
}
