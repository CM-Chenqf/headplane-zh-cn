import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import Link from "~/components/link";
import { Message, useI18n } from "~/i18n/provider";
import cn from "~/utils/cn";

export interface FooterProps {
  isDebug: boolean;
  baseUrl: string;
}

export default function Footer({ isDebug, baseUrl }: FooterProps) {
  const { t } = useI18n();
  const [urlVisible, setUrlVisible] = useState(false);

  return (
    <footer className={cn("fixed w-full bottom-0 left-0 z-20", "bg-surface border-t border-line")}>
      <div className="container flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="min-w-0 text-xs">
          <Message
            id="footer.sponsor"
            values={{
              link: (
                <Link external styled to="https://tale.me/sponsor">
                  {t("footer.sponsorLink")}
                </Link>
              ),
            }}
          />
        </p>
        <div className="flex min-w-0 items-center gap-2 text-xs">
          {isDebug && (
            <span
              className={cn("rounded-full px-2 py-0.5 font-medium", "bg-warn-subtle text-warn")}
            >
              {t("footer.debug")}
            </span>
          )}
          <p className="text-muted">
            {__VERSION__} &middot;{" "}
            {urlVisible ? (
              <code className="break-all">{baseUrl}</code>
            ) : (
              <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
            )}
            <button
              type="button"
              aria-label={t(urlVisible ? "footer.hideUrl" : "footer.showUrl")}
              className={cn(
                "ml-1 inline-flex align-middle rounded-xs p-0.5",
                "text-muted hover:text-muted",
                "focus-ring",
              )}
              onClick={() => setUrlVisible((v) => !v)}
            >
              {urlVisible ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
}
