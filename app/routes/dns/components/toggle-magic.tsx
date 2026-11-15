import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";
import { useI18n } from "~/i18n/provider";

interface Props {
  isEnabled: boolean;
  isDisabled: boolean;
}

export default function Modal({ isEnabled, isDisabled }: Props) {
  const { t } = useI18n();
  return (
    <Dialog>
      <Button disabled={isDisabled}>{t(isEnabled ? "dns.disableMagic" : "dns.enableMagic")}</Button>
      <DialogPanel isDisabled={isDisabled}>
        <Title>{t(isEnabled ? "dns.disableMagic" : "dns.enableMagic")}</Title>
        <Text>{t(isEnabled ? "dns.disableMagicDescription" : "dns.enableMagicDescription")}</Text>
        <input type="hidden" name="action_id" value="toggle_magic" />
        <input type="hidden" name="new_state" value={isEnabled ? "disabled" : "enabled"} />
      </DialogPanel>
    </Dialog>
  );
}
