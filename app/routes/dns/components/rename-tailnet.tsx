import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { useI18n } from "~/i18n/provider";

interface Props {
  name: string;
  isDisabled: boolean;
}

export default function RenameTailnet({ name, isDisabled }: Props) {
  const { t } = useI18n();
  return (
    <ActionDialog
      description={t("dns.renameDescription")}
      intent="rename_tailnet"
      submitLabel={t("dns.rename")}
      title={t("dns.renameTitle")}
      trigger={
        <Button disabled={isDisabled} size="sm">
          {t("dns.rename")}
        </Button>
      }
    >
      <Input
        defaultValue={name}
        label={t("dns.tailnetName")}
        name="name"
        placeholder="ts.net"
        required
      />
    </ActionDialog>
  );
}
