import Header from "@/components/header";
import { useMDXComponents } from "@/components/mdx";
import { docsRoute } from "@/lib/i18n";
import { changelog } from "@/lib/source";
import { useDocsLocale } from "@/lib/use-locale";

export function meta({ location }: { location: { pathname: string } }) {
  const isChinese = docsRoute(location.pathname).locale === "zh-CN";
  return [
    { title: `${isChinese ? "更新日志" : "Changelog"} | Headplane` },
    {
      name: "description",
      content: isChinese
        ? "Headplane 各版本的新功能与修复记录。"
        : "New features and fixes in every Headplane release.",
    },
  ];
}

export default function Changelog() {
  const { locale, t } = useDocsLocale();
  const entry = changelog.get(locale === "zh-CN" ? "CHANGELOG.zh-CN.md" : "CHANGELOG.md");
  if (!entry) {
    throw new Error("CHANGELOG.md is missing from the changelog collection");
  }

  const Body = entry.body;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">{t("Changelog", "更新日志")}</h1>
        <p className="text-muted mt-2 mb-12">
          {t(
            "New features and fixes in every Headplane release.",
            "Headplane 各版本的新功能与修复记录。",
          )}
        </p>
        <div>
          <Body components={useMDXComponents()} />
        </div>
      </main>
    </>
  );
}
