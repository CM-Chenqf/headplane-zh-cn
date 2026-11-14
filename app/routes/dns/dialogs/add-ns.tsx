import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { SwitchField } from "~/components/switch";
import { useI18n } from "~/i18n/provider";
import { fieldValidator } from "~/utils/form";

import { dnsSchemas } from "../schemas";

export default function AddNameserver() {
  const { locale, t } = useI18n();
  const validateNameserver = useMemo(() => fieldValidator(dnsSchemas(locale).nameserver), [locale]);
  const [isSplit, setIsSplit] = useState(false);

  return (
    <ActionDialog
      intent="add_ns"
      onOpenChange={(isOpen) => isOpen && setIsSplit(false)}
      submitLabel={t("dns.addNameserver")}
      title={t("dns.addNameserver")}
      trigger={
        <Button>
          <Plus className="size-3.5" />
          {t("dns.addNameserver")}
        </Button>
      }
    >
      <Input
        description={t("dns.nameserverDescription")}
        label={t("dns.nameserver")}
        name="nameserver"
        placeholder="1.2.3.4"
        required
        validate={validateNameserver}
      />
      <SwitchField
        checked={isSplit}
        description={t("dns.splitDescription")}
        label={t("dns.restrictDomain")}
        onCheckedChange={setIsSplit}
      />
      {isSplit && (
        <Input
          description={t("dns.splitDomainDescription")}
          label={t("dns.domain")}
          name="split_domain"
          placeholder="example.com"
          required
        />
      )}
    </ActionDialog>
  );
}
