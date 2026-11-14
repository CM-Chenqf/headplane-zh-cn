import { useI18n } from "~/i18n/provider";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface SubnetTagProps {
  isEnabled?: boolean;
  count: number;
}

export function SubnetTag({ isEnabled, count }: SubnetTagProps) {
  const { t } = useI18n();
  return (
    <Tooltip content={t(isEnabled ? "machines.subnetApprovedHint" : "machines.subnetWaitingHint")}>
      <Chip
        text={t(count === 1 ? "machines.subnetCount.one" : "machines.subnetCount.other", { count })}
        variant={isEnabled ? "neutral" : "warn"}
      />
    </Tooltip>
  );
}
