import type { Plugin } from "vite";

// These labels are hardcoded by the pinned VitePress default theme instead of
// exposed as locale options. Translate only those labels before Vue compiles
// the components, so server rendering and client navigation stay identical.
export function localizeThemeLabels(): Plugin {
  const labels: Record<string, [string, string]> = {
    "VPNavBarMenu.vue": ["Main Navigation", "主导航"],
    "VPSidebar.vue": ["Sidebar Navigation", "侧边导航"],
    "VPDocFooter.vue": ["Pager", "页面导航"],
    "VPNavBarHamburger.vue": ["mobile navigation", "移动端导航"],
    "VPNavBarExtra.vue": ["extra navigation", "更多导航"],
    "VPLocalSearchBox.vue": ["Loading search results", "正在加载搜索结果"],
  };
  return {
    name: "headplane-bilingual-theme-labels",
    enforce: "pre",
    transform(source, id) {
      const file = id.replaceAll("\\", "/");
      if (!file.includes("/vitepress/dist/client/theme-default/components/")) return;
      const label = labels[file.split("/").at(-1) ?? ""];
      if (!label) return;
      const [english, chinese] = label;
      const expression = `headplaneLocale === 'zh-CN' ? '${chinese}' : '${english}'`;
      const target = file.endsWith("VPNavBarHamburger.vue")
        ? `aria-label="${english}"`
        : file.endsWith("VPNavBarExtra.vue")
          ? `label="${english}"`
          : file.endsWith("VPLocalSearchBox.vue")
            ? `'${english}'`
            : english;
      if (!source.includes(target))
        throw new Error(`Review the VitePress translation for ${file}: ${english}`);
      const replacement = target.startsWith("aria-label=")
        ? `:aria-label="${expression}"`
        : target.startsWith("label=")
          ? `:label="${expression}"`
          : target.startsWith("'")
            ? `(${expression})`
            : `{{ ${expression} }}`;
      return source
        .replace(target, replacement)
        .replace(
          /(<script\b[^>]*>)/,
          "$1\nimport { useData as useHeadplaneLocaleData } from 'vitepress'\nconst { lang: headplaneLocale } = useHeadplaneLocaleData()\n",
        );
    },
  };
}
