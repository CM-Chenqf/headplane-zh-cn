import { Info } from "lucide-react";

import { useI18n } from "~/i18n/provider";
import cn from "~/utils/cn";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface ExitNodeTagProps {
  isEnabled?: boolean;
}

export function ExitNodeTag({ isEnabled }: ExitNodeTagProps) {
  const { t } = useI18n();
  return (
    <Tooltip
      content={
        isEnabled ? <>{t("machines.exitApprovedHint")}</> : <>{t("machines.exitWaitingHint")}</>
      }
    >
      <Chip
        text={t("machines.exitNode")}
        className={cn("bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-300")}
        rightIcon={isEnabled ? undefined : <Info className="h-full w-fit" />}
      />
    </Tooltip>
  );
}
