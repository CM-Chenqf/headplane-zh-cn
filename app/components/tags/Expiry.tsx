import { useI18n } from "~/i18n/provider";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface ExpiryTagProps {
  variant: "expired" | "no-expiry";
  expiry?: string;
}

export function ExpiryTag({ variant, expiry }: ExpiryTagProps) {
  const { t, locale } = useI18n();
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Tooltip
      content={
        variant === "expired" ? <>{t("machines.expiredHint")}</> : <>{t("machines.noExpiryHint")}</>
      }
    >
      <Chip
        text={
          variant === "expired"
            ? t("time.expired", { time: formatter.format(new Date(expiry!)) })
            : t("expiry.never")
        }
        className="bg-mist-200 text-mist-800 dark:bg-mist-800 dark:text-mist-200"
      />
    </Tooltip>
  );
}
