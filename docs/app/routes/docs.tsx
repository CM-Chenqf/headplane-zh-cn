import { useFumadocsLoader } from "fumadocs-core/source/client";
import type { TOCItemType } from "fumadocs-core/toc";
import { SidebarProvider, SidebarTrigger, useSidebar } from "fumadocs-ui/components/sidebar/base";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";
import { Menu } from "lucide-react";
import { use } from "react";

import Header, { iconButtonClass } from "@/components/header";
import { useMDXComponents } from "@/components/mdx";
import Sidebar from "@/components/sidebar";
import { upgradeToc } from "@/components/upgrade-notes";
import { docsRoute } from "@/lib/i18n";
import { docs, source } from "@/lib/source";
import { useDocsLocale } from "@/lib/use-locale";

import type { Route } from "./+types/docs";

export async function loader({ params }: Route.LoaderArgs) {
  const { locale, path } = docsRoute(`/${params["*"]}`);
  const slugs = path.split("/").filter((slug) => slug.length > 0);
  const page = source.getPage(slugs, locale);
  if (!page) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    path: page.path,
    title: page.data.title,
    description: page.data.description,
    pageTree: await source.serializePageTree(source.getPageTree(locale)),
    extraToc: /^upgrading(?:\.zh-CN)?\.mdx$/.test(page.path) ? upgradeToc(locale) : [],
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const title = { title: `${loaderData.title} | Headplane` };
  if (!loaderData.description) {
    return [title];
  }

  return [title, { name: "description", content: loaderData.description }];
}

function Content({ path, extraToc }: { path: string; extraToc: TOCItemType[] }) {
  const page = docs.getPage(path);
  if (!page) {
    throw new Error(`Unknown page: ${path}`);
  }

  const { toc } = use(page.load());
  const Body = page.body;

  return (
    <DocsPage toc={[...extraToc, ...toc.filter((item) => item.depth > 1)]}>
      <DocsBody>
        <Body components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

function DocsHeader() {
  const { t } = useDocsLocale();
  return (
    <Header
      menu={
        <SidebarTrigger
          aria-label={t("Navigation", "导航")}
          className={`${iconButtonClass} md:hidden`}
        >
          <Menu />
        </SidebarTrigger>
      }
    />
  );
}

// Fumadocs puts its header beside the sidebar; ours spans the full width like
// the app's, so the sidebar and TOC stick below it.
const containerStyle = {
  gridTemplate: `"header header header header header"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar tabs toc toc"
"sidebar sidebar main toc toc" 1fr / minmax(min-content, 1fr) var(--fd-sidebar-col) minmax(0, calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(min-content, 1fr)`,
  "--fd-docs-row-1": "calc(var(--fd-banner-height, 0px) + 3.25rem)",
};

const slots = {
  header: DocsHeader,
  sidebar: { provider: SidebarProvider, root: Sidebar, trigger: SidebarTrigger, useSidebar },
};

export default function Page({ loaderData }: Route.ComponentProps) {
  const { path, pageTree, extraToc } = useFumadocsLoader(loaderData);

  return (
    <DocsLayout containerProps={{ style: containerStyle }} slots={slots} tree={pageTree}>
      <Content extraToc={extraToc} path={path} />
    </DocsLayout>
  );
}
