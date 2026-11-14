import { useI18n } from "~/i18n/provider";

import Chip from "../chip";
import Tooltip from "../tooltip";

export function HeadplaneAgentTag() {
  const { t } = useI18n();
  return (
    <Tooltip content={t("machines.agentHint")}>
      <Chip text={t("machines.agent")} />
    </Tooltip>
  );
}
