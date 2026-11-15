import { type } from "arktype";

import Button from "~/components/button";
import Code from "~/components/code";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Select from "~/components/select";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";
import { Message, useI18n } from "~/i18n/provider";

const recordSchema = type({
  record_type: "'A' | 'AAAA'",
  record_name: "string > 0",
  record_value: "string > 0",
});

interface Props {
  records: { name: string; type: "A" | "AAAA" | string; value: string }[];
}

export default function AddRecord({ records }: Props) {
  const { t } = useI18n();
  const form = useForm({
    schema: recordSchema,
    localizeError: (_name, error) =>
      t(error === "dns.duplicateRecord" ? "dns.duplicateRecord" : "validation.required"),
    defaultValues: { record_type: "A" },
    validate: (values) => {
      const name = values.record_name as string;
      const ip = values.record_value as string;
      if (name.length === 0 || ip.length === 0) return undefined;

      const lookup = records.find((r) => r.name === name);
      if (lookup?.value === ip) {
        return {
          record_name: "dns.duplicateRecord",
          record_value: "dns.duplicateRecord",
        };
      }

      return undefined;
    },
  });
  const name = form.values.record_name as string;
  const ip = form.values.record_value as string;
  const recordType = form.values.record_type as string;
  const isDuplicate = records.some((record) => record.name === name && record.value === ip);

  return (
    <Dialog>
      <Button>{t("dns.addRecord")}</Button>
      <DialogPanel onSubmit={() => form.reset()}>
        <Title>{t("dns.addRecord")}</Title>
        <Text>{t("dns.addRecordDescription")}</Text>
        <div className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="action_id" value="add_record" />
          <Select
            required
            label={t("dns.recordType")}
            name="record_type"
            defaultValue={recordType}
            onValueChange={(v) => {
              if (v) form.setValue("record_type", v);
            }}
            items={[
              { value: "A", label: "A" },
              { value: "AAAA", label: "AAAA" },
            ]}
          />
          <Input
            {...form.field("record_name")}
            required
            label={t("dns.domain")}
            placeholder="test.example.com"
          />
          <Input
            {...form.field("record_value")}
            required
            label={t("dns.ip")}
            placeholder={recordType === "AAAA" ? "2001:db8::ff00:42:8329" : "101.101.101.101"}
          />
          {isDuplicate ? (
            <p className="text-sm opacity-50">
              <Message
                id="dns.duplicateRecordDescription"
                values={{ name: <Code>{name}</Code>, ip: <Code>{ip}</Code> }}
              />
            </p>
          ) : undefined}
        </div>
      </DialogPanel>
    </Dialog>
  );
}
