import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import Select from "~/components/select";
import { useI18n } from "~/i18n/provider";
import { fieldValidator } from "~/utils/form";

import { dnsSchemas } from "../schemas";

export default function AddRecord() {
  const { locale, t } = useI18n();
  const validators = useMemo(() => {
    const { recordValue } = dnsSchemas(locale);
    return { A: fieldValidator(recordValue.A), AAAA: fieldValidator(recordValue.AAAA) };
  }, [locale]);
  const [type, setType] = useState<keyof typeof validators>("A");

  return (
    <ActionDialog
      description={t("dns.addRecordDescription")}
      intent="add_record"
      submitLabel={t("dns.addRecord")}
      title={t("dns.addRecordTitle")}
      trigger={
        <Button>
          <Plus className="size-3.5" />
          {t("dns.addRecord")}
        </Button>
      }
    >
      <Select
        items={[
          { value: "A", label: "A" },
          { value: "AAAA", label: "AAAA" },
        ]}
        label={t("dns.recordType")}
        name="type"
        onValueChange={(value) => {
          if (value === "A" || value === "AAAA") setType(value);
        }}
        required
        value={type}
      />
      <Input label={t("dns.domain")} name="name" placeholder="test.example.com" required />
      <Input
        key={type}
        label={t("dns.ipAddress")}
        name="value"
        placeholder={type === "AAAA" ? "2001:db8::ff00:42:8329" : "100.100.100.100"}
        required
        validate={validators[type]}
      />
    </ActionDialog>
  );
}
