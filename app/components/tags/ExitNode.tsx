import { useI18n } from "~/i18n/provider";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface ExitNodeTagProps {
  isEnabled?: boolean;
}

export function ExitNodeTag({ isEnabled }: ExitNodeTagProps) {
  const { t } = useI18n();
  return (
    <Tooltip content={t(isEnabled ? "machines.exitApprovedHint" : "machines.exitWaitingHint")}>
      <Chip text={t("machines.exitNode")} variant={isEnabled ? "neutral" : "warn"} />
    </Tooltip>
  );
}
