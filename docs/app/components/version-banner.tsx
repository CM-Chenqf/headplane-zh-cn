import { Banner } from "fumadocs-ui/components/banner";

import { docsBuild, releaseArchiveUrl } from "@/lib/releases";
import { useDocsLocale } from "@/lib/use-locale";

export default function VersionBanner() {
  const { t } = useDocsLocale();
  if (docsBuild.channel !== "beta" && docsBuild.channel !== "archived") {
    return null;
  }

  const isBeta = docsBuild.channel === "beta";

  return (
    <Banner className="bg-warn-subtle text-warn h-9 text-sm">
      {isBeta ? (
        <>
          <span className="sm:hidden">
            {t("Beta", "预览版")} · <code>{docsBuild.version}</code>
          </span>
          <span className="max-sm:hidden">
            {t("Beta docs, built from", "预览文档，构建自")} <code>main</code> @{" "}
            <code className="font-semibold">{docsBuild.version}</code>
            {docsBuild.date && t(` on ${docsBuild.date}.`, ` · ${docsBuild.dateZh}`)}
          </span>
        </>
      ) : (
        <>
          <span className="sm:hidden">
            Headplane <strong>{docsBuild.version}</strong> {t("docs.", "文档")}
          </span>
          <span className="max-sm:hidden">
            {t("These docs are for Headplane", "本文档适用于 Headplane")}{" "}
            <strong>{docsBuild.version}</strong>
            {t(".", "。")}
          </span>
        </>
      )}
      <a className="ml-2 underline" href={releaseArchiveUrl}>
        {t("Release documentation →", "发行文档 →")}
      </a>
    </Banner>
  );
}
