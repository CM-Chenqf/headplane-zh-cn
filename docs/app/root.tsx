import "@fontsource-variable/inter/opsz.css";
import { RootProvider } from "fumadocs-ui/provider/react-router";
import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";

import Header from "@/components/header";
import DocsSearchDialog from "@/components/search";
import VersionBanner from "@/components/version-banner";
import { chineseUI, localizedPath } from "@/lib/i18n";
import { useDocsLocale } from "@/lib/use-locale";

import type { Route } from "./+types/root";

import "./app.css";

export function Layout({ children }: { children: ReactNode }) {
  const { locale } = useDocsLocale();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link href={`${import.meta.env.BASE_URL}favicon.ico`} rel="icon" sizes="32x32" />
        <link href={`${import.meta.env.BASE_URL}favicon.svg`} rel="icon" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          i18n={{
            locale,
            defaultLanguage: "en",
            hideLocale: "default-locale",
            translations: locale === "zh-CN" ? chineseUI : {},
            onLocaleChange: (next) => {
              if (next === "en" || next === "zh-CN") {
                void navigate(`${localizedPath(pathname, next)}${search}${hash}`);
              }
            },
          }}
          search={{ SearchDialog: DocsSearchDialog }}
        >
          {children}
        </RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <VersionBanner />
      <Outlet />
    </>
  );
}

// A missing page is a 404 when navigating within the site. Loaded directly, it
// comes from the prerendered fallback, which has no data for the route.
function isNotFound(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.status === 404;
  }

  return error instanceof Error && error.message.startsWith("No result found for routeId");
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const isMissing = isNotFound(error);
  const { t, href } = useDocsLocale();

  return (
    <>
      <VersionBanner />
      <Header />
      <main className="mx-auto flex max-w-xl flex-col gap-2 px-6 py-24">
        <h1 className="text-2xl font-semibold">
          {isMissing ? t("Page not found", "页面不存在") : t("Something went wrong", "发生错误")}
        </h1>
        {!isMissing && error instanceof Error && (
          <pre className="text-muted text-xs whitespace-pre-wrap">{error.message}</pre>
        )}
        <a
          className="text-accent"
          href={`${import.meta.env.BASE_URL}${href("/").replace(/^\//, "")}`}
        >
          {t("Back to the docs", "返回文档")}
        </a>
      </main>
    </>
  );
}
