import { useI18n } from "~/i18n/provider";

import Chip from "../chip";
import Tooltip from "../tooltip";

export function TailscaleSSHTag() {
  const { t } = useI18n();
  return (
    <Tooltip content={t("machines.sshHint")}>
      <Chip text="SSH" />
    </Tooltip>
  );
}
