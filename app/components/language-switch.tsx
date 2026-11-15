import { Languages } from "lucide-react";
import { useFetcher } from "react-router";

import { useI18n } from "~/i18n/provider";

export default function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const fetcher = useFetcher();
  const nextLocale = locale === "en" ? "zh-CN" : "en";
  const language = nextLocale === "en" ? "English" : "简体中文";

  return (
    <fetcher.Form action="/api/locale" method="POST">
      <input name="locale" type="hidden" value={nextLocale} />
      <button
        aria-label={t("language.switch", { language })}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-mist-600 hover:bg-mist-300/50 hover:text-mist-900 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:text-mist-300 dark:hover:bg-mist-800 dark:hover:text-mist-50"
        disabled={fetcher.state !== "idle"}
        title={t("language.switch", { language })}
        type="submit"
      >
        <Languages aria-hidden className="size-4" />
        <span className={compact ? "hidden lg:inline" : undefined} lang={nextLocale}>
          {language}
        </span>
      </button>
    </fetcher.Form>
  );
}
