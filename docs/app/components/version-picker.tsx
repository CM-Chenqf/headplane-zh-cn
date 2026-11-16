import { ExternalLink } from "lucide-react";

import { docsBuild, releaseArchiveUrl } from "@/lib/releases";
import { useDocsLocale } from "@/lib/use-locale";

export default function VersionPicker({ className = "" }: { className?: string }) {
  const { t } = useDocsLocale();
  if (!docsBuild.channel) return null;

  return (
    <a
      className={`text-muted hover:bg-hover hover:text-fg focus-visible:outline-accent inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium focus-visible:outline-2 ${className}`}
      href={releaseArchiveUrl}
      title={t("Download documentation from GitHub Releases", "从 GitHub Releases 下载文档")}
    >
      {docsBuild.channel === "beta" ? t("Beta", "预览版") : docsBuild.version}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
