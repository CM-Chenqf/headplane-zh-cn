import Button from "~/components/button";
import Code from "~/components/code";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { Message, useI18n } from "~/i18n/provider";

import { useNativeValidation } from "../../users/use-native-validation";

interface Props {
  name: string;
  isDisabled: boolean;
}

export default function RenameTailnet({ name, isDisabled }: Props) {
  const { t } = useI18n();
  const validation = useNativeValidation();
  return (
    <div className="flex w-full flex-col gap-y-4 sm:w-2/3">
      <h1 className="mb-2 text-2xl font-medium">{t("dns.tailnetTitle")}</h1>
      <p>
        <Message
          id="dns.tailnetDescription"
          values={{ address: <Code>{t("dns.deviceDomain", { domain: name })}</Code> }}
        />
      </p>
      <Input
        className="w-3/5 text-sm font-medium"
        readOnly
        label={t("dns.tailnetTitle")}
        labelHidden
        onFocus={(event) => {
          (event.target as HTMLInputElement).select();
        }}
        value={name}
      />
      <Dialog>
        <Button disabled={isDisabled}>{t("dns.rename")}</Button>
        <DialogPanel isDisabled={isDisabled}>
          <Title>{t("dns.rename")}</Title>
          <Text className="mb-8">{t("dns.renameWarning")}</Text>
          <input name="action_id" type="hidden" value="rename_tailnet" />
          <Input
            {...validation.field("new_name", "validation.invalid")}
            defaultValue={name}
            required
            label={t("dns.tailnetTitle")}
            name="new_name"
            placeholder="ts.net"
          />
        </DialogPanel>
      </Dialog>
    </div>
  );
}
