import { useI18n } from "~/i18n/provider";
import { formatTimeUntil } from "~/utils/time";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface ExpiryTagProps {
  variant: "expired" | "expiring" | "no-expiry";
  expiry?: string;
}

export function ExpiryTag({ variant, expiry }: ExpiryTagProps) {
  const { locale, t } = useI18n();
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const date = expiry ? formatter.format(new Date(expiry)) : undefined;

  switch (variant) {
    case "expired":
      return (
        <Tooltip content={t("expiry.expiredHint", { date: date ?? "" })}>
          <Chip text={t("expiry.expired")} variant="bad" />
        </Tooltip>
      );

    case "expiring":
      return (
        <Tooltip content={t("expiry.expiringHint", { date: date ?? "" })}>
          <Chip
            text={t("expiry.expiring", { time: formatTimeUntil(new Date(expiry!), locale) })}
            variant="warn"
          />
        </Tooltip>
      );

    case "no-expiry":
      return (
        <Tooltip content={t("expiry.neverHint")}>
          <Chip text={t("expiry.never")} />
        </Tooltip>
      );
  }
}
