import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";

import { docsRoute, localizedPath } from "./i18n";

const subscribe = () => () => {};

// Static HTML cannot know the visitor's query or fragment. Match that HTML
// during hydration, then update the actual href (including for new tabs).
export function useDocsDestination() {
  const { pathname, search, hash } = useLocation();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return `${pathname.replace(/\/+$/, "") || "/"}${mounted ? `${search}${hash}` : ""}`;
}

export function useDocsLocale() {
  const location = useLocation();
  const { locale, path } = docsRoute(location.pathname);
  return {
    locale,
    path,
    t: (english: string, chinese: string) => (locale === "zh-CN" ? chinese : english),
    href: (href: string) => localizedPath(href, locale),
  };
}
