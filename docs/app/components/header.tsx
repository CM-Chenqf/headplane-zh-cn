import { Dialog } from "@base-ui/react/dialog";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Monitor, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Fragment, type ReactNode, useSyncExternalStore } from "react";
import { Link } from "react-router";

import LogoMark from "@/components/logo-mark";
import VersionPicker from "@/components/version-picker";
import { localizedPath } from "@/lib/i18n";
import { docsBuild } from "@/lib/releases";
import { useDocsDestination, useDocsLocale } from "@/lib/use-locale";

export const iconButtonClass =
  "text-muted hover:bg-hover hover:text-fg inline-flex size-8 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:size-4";

const themeOptionClass =
  "focus-visible:outline-accent inline-flex size-6 items-center justify-center rounded-[4px] focus-visible:outline-2 [&_svg]:size-3.5";

const themeList = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const links = [
  { to: "/introduction", label: "Docs" },
  { to: "/changelog", label: "Changelog" },
];

export default function Header({ menu }: { menu?: ReactNode }) {
  const destination = useDocsDestination();
  const { locale, path, t, href } = useDocsLocale();
  const isChangelog = path.startsWith("/changelog");

  return (
    <header className="bg-surface border-line sticky top-[var(--fd-banner-height,0px)] z-30 h-13 border-b [contain:inline-size] [grid-area:header]">
      <div className="flex h-full items-center gap-x-5 px-4 md:px-6">
        <Link className="flex items-center gap-x-2" to={href("/")}>
          <LogoMark className="size-[18px] shrink-0" />
          <span className="text-sm font-semibold tracking-tight">headplane</span>
        </Link>
        <nav className="hidden items-center gap-x-0.5 text-[13px] font-medium md:flex">
          {links.map((link) => {
            const isActive = link.to === "/changelog" ? isChangelog : path !== "/" && !isChangelog;

            return (
              <Link
                className={
                  isActive
                    ? "text-fg rounded-md px-2.5 py-1.5"
                    : "text-muted hover:text-fg rounded-md px-2.5 py-1.5"
                }
                key={link.to}
                to={href(link.to)}
              >
                {link.to === "/changelog" ? t("Changelog", "更新日志") : t("Docs", "文档")}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-x-1">
          <SearchButton />
          <Link
            aria-label={t("Switch to Simplified Chinese", "切换为英文")}
            className="text-muted hover:bg-hover hover:text-fg shrink-0 rounded-md px-2 py-1.5 text-xs"
            lang={locale === "en" ? "zh-CN" : "en"}
            to={localizedPath(destination, locale === "en" ? "zh-CN" : "en")}
          >
            {locale === "en" ? "中文" : "EN"}
          </Link>
          <VersionPicker className="max-sm:hidden" />
          <a
            aria-label="GitHub"
            className={iconButtonClass}
            href={`https://github.com/${docsBuild.repository}`}
          >
            <GitHubIcon />
          </a>
          <ThemePicker />
          {menu}
        </div>
      </div>
    </header>
  );
}

function ThemePicker() {
  const { t } = useDocsLocale();
  const themeLabel = (label: string) =>
    t(label, label === "Light" ? "浅色" : label === "Dark" ? "深色" : "跟随系统");
  const { theme, setTheme } = useTheme();

  // The stored choice only exists in the browser, so prerendered HTML shows none selected.
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Until a choice is stored, the theme follows the system, the last option.
  const storedIndex = isMounted ? themeList.findIndex((item) => item.value === theme) : -1;
  const currentIndex = storedIndex === -1 ? themeList.length - 1 : storedIndex;
  const current = themeList[currentIndex];
  const next = themeList[(currentIndex + 1) % themeList.length];

  return (
    <>
      <button
        aria-label={`${t("Theme", "主题")}: ${themeLabel(current.label)}`}
        className={`${iconButtonClass} sm:hidden`}
        onClick={() => setTheme(next.value)}
        title={`${t("Theme", "主题")}: ${themeLabel(current.label)}`}
        type="button"
      >
        <current.Icon />
      </button>
      <div
        aria-label={t("Theme", "主题")}
        className="border-line hidden h-8 items-center gap-0.5 rounded-md border p-0.5 sm:flex"
        role="radiogroup"
      >
        {themeList.map(({ value, label, Icon }) => {
          const isActive = isMounted && theme === value;

          return (
            <button
              aria-checked={isActive}
              aria-label={themeLabel(label)}
              className={`${themeOptionClass} ${isActive ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}
              key={value}
              onClick={() => setTheme(value)}
              role="radio"
              title={themeLabel(label)}
              type="button"
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </>
  );
}

function SearchButton() {
  const { t } = useDocsLocale();
  const { enabled, hotKey, dialogHandle } = useSearchContext();
  if (!enabled) {
    return null;
  }

  return (
    <>
      <Dialog.Trigger
        aria-label={t("Search", "搜索")}
        className={`${iconButtonClass} md:hidden`}
        handle={dialogHandle}
      >
        <Search />
      </Dialog.Trigger>
      <Dialog.Trigger
        className="border-line-strong bg-surface text-muted hover:text-fg mr-2 hidden h-8 w-60 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors md:inline-flex"
        handle={dialogHandle}
      >
        <Search className="size-4" />
        {t("Search docs", "搜索文档")}
        <kbd className="border-line text-faint ml-auto rounded border px-1 font-sans text-xs">
          {hotKey.map((key, index) => (
            <Fragment key={index}>{key.display}</Fragment>
          ))}
        </kbd>
      </Dialog.Trigger>
    </>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
