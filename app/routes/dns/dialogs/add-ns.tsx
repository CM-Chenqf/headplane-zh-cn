import { type } from "arktype";
import { Split } from "lucide-react";

import Button from "~/components/button";
import Chip from "~/components/chip";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Switch from "~/components/switch";
import Text from "~/components/text";
import Title from "~/components/title";
import Tooltip from "~/components/tooltip";
import { useForm } from "~/hooks/use-form";
import { useI18n } from "~/i18n/provider";
import cn from "~/utils/cn";

const nsSchema = type({
  ns: "string.ip",
  split_name: "string > 0",
});

interface Props {
  nameservers: Record<string, string[]>;
}

export default function AddNameserver({ nameservers }: Props) {
  const { t } = useI18n();
  const form = useForm({
    schema: nsSchema,
    localizeError: (name, error) =>
      t(
        error === "validation.required"
          ? "validation.required"
          : error === "dns.duplicateNs"
            ? "dns.duplicateNs"
            : name === "ns"
              ? "dns.validation.ns"
              : "validation.required",
      ),
    defaultValues: { split_name: "global" },
    validate: (values) => {
      const ns = values.ns as string;
      const domain = values.split_name as string;
      if (!ns) return undefined;

      const isSplit = domain !== "global";
      const isDuplicate = isSplit
        ? nameservers[domain]?.includes(ns)
        : Object.values(nameservers).some((nsList) => nsList.includes(ns));

      if (isDuplicate) {
        return { ns: "dns.duplicateNs" };
      }

      return undefined;
    },
  });
  const split = (form.values.split_name as string) !== "global";

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && form.reset()}>
      <Button>{t("dns.addNs")}</Button>
      <DialogPanel>
        <Title className="mb-4">{t("dns.addNs")}</Title>
        <input name="action_id" type="hidden" value="add_ns" />
        <Input
          {...form.field("ns")}

          description={t("dns.nsDescription")}
          required
          label={t("dns.nameservers")}
          placeholder="1.2.3.4"
        />
        <div className="mt-8 flex items-center justify-between">
          <div className="block">
            <div className="inline-flex items-center gap-2">
              <Text className="font-semibold">{t("dns.restrictDomain")}</Text>
              <Tooltip content={t("dns.splitTooltip")}>
                <Chip
                  className={cn("inline-flex items-center")}
                  leftIcon={<Split className="mr-0.5 h-3 w-3" />}
                  text={t("dns.split")}
                />
              </Tooltip>
            </div>
            <Text className="text-sm">{t("dns.splitDescription")}</Text>
          </div>
          <Switch
            label={t("dns.split")}
            checked={split}
            onCheckedChange={(checked) => {
              form.setValue("split_name", checked ? "" : "global");
            }}
          />
        </div>
        {split ? (
          <>
            <Text className="mt-8 font-semibold">{t("dns.domain")}</Text>
            <Input
              {...form.field("split_name")}

              required
              label={t("dns.domain")}
              placeholder="example.com"
            />
            <Text className="text-sm">{t("dns.splitDomainDescription")}</Text>
          </>
        ) : (
          <input name="split_name" type="hidden" value="global" />
        )}
      </DialogPanel>
    </Dialog>
  );
}
