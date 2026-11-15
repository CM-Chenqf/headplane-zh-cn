// Paths here are relative to React Router's basename. The router adds an
// archive prefix (for example /0.8/) exactly once when it renders links.
export type DocsLocale = "en" | "zh-CN";

export const docsI18n = {
  languages: ["en", "zh-CN"],
  defaultLanguage: "en",
  hideLocale: "default-locale",
  fallbackLanguage: null,
} as const;

export function docsRoute(path: string): { locale: DocsLocale; path: string } {
  if (/^\/zh-CN(?:\/|$|[?#])/.test(path)) {
    return { locale: "zh-CN", path: path.slice(6) || "/" };
  }
  return { locale: "en", path };
}

export function localizedPath(path: string, locale: DocsLocale): string {
  // External, protocol-relative, fragment-only and relative links are not
  // site paths. Downloads and images also keep their original addresses.
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /\.[a-z\d]+$/i.test(path.split(/[?#]/, 1)[0])
  ) {
    return path;
  }
  const bare = docsRoute(path).path;
  if (locale === "en") return bare.startsWith("/") ? bare : `/${bare}`;
  return `/zh-CN${bare === "/" ? "" : bare.startsWith("/") ? bare : `/${bare}`}`;
}

export function docsPath(file: string): string {
  const normalized = file.replaceAll("\\", "/");
  const locale = /\.zh-CN\.mdx?$/.test(normalized) ? "zh-CN" : "en";
  const path = `/${normalized.replace(/(?:\.zh-CN)?\.mdx?$/, "").replace(/(?:^|\/)index$/, "")}`;
  return localizedPath(path.replace(/\/$/, "") || "/", locale);
}

export const chineseUI = {
  // Fuma Translate includes each component's context notes in the key.
  "Search(search dialog)": "搜索",
  "Close Search(search dialog)(aria-label)": "关闭搜索",
  "No results found(search dialog)": "未找到结果",
  "Search failed(search dialog)": "搜索失败",
  "Search failed, showing results for {query}(search dialog)": "搜索失败，显示 {query} 的结果",
  "On this page(table of contents)": "本页内容",
  "Table of Contents(inline table of contents)": "目录",
  "Previous Page(pagination)": "上一页",
  "Next Page(pagination)": "下一页",
  "Copy Anchor Link(heading anchor)(aria-label)": "复制锚点链接",
  "Copied Anchor Link(heading anchor)(aria-label)": "已复制锚点链接",
  "Copy Text(code block)(aria-label)": "复制文本",
  "Copied Text(code block)(aria-label)": "已复制文本",
  "Open Sidebar(sidebar)(aria-label)": "打开侧栏",
  "Close Sidebar(sidebar)(aria-label)": "关闭侧栏",
  "Collapse Sidebar(sidebar)(aria-label)": "折叠侧栏",
  "Close Banner(banner)(aria-label)": "关闭横幅",
  "Edit on GitHub(edit page)": "在 GitHub 上编辑",
  "Last updated on(page footer)": "最后更新于",
  "No Headings(table of contents)": "暂无标题",
};
