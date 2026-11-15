import { useData, withBase, type Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { defineComponent, h } from "vue";

import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    setup() {
      const { lang } = useData();
      const notice = () =>
        h(
          "aside",
          {
            class: "community-notice",
            "aria-label": lang.value === "zh-CN" ? "来源说明" : "Project attribution",
          },
          [
            lang.value === "zh-CN"
              ? "非官方社区中英双语维护版，基于 "
              : "Unofficial community bilingual fork of ",
            h("a", { href: "https://github.com/tale/headplane" }, "tale/headplane"),
            lang.value === "zh-CN"
              ? "，保留 MIT 许可证与原作者署名。"
              : ". Upstream MIT license and attribution retained.",
          ],
        );
      return () =>
        h(DefaultTheme.Layout, null, {
          "doc-before": notice,
          "home-hero-before": notice,
          "layout-top": () =>
            __HEADPLANE_BETA_DOCS__
              ? h("div", { class: "beta-banner" }, [
                  lang.value === "zh-CN"
                    ? "当前为 Headplane 测试版文档。"
                    : "You are viewing Headplane beta documentation. ",
                  h(
                    "a",
                    { href: withBase(lang.value === "zh-CN" ? "/zh-CN/" : "/") },
                    lang.value === "zh-CN" ? "返回文档首页 →" : "Documentation home →",
                  ),
                ])
              : null,
        });
    },
  }),
} satisfies Theme;
