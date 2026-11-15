import { Link } from "react-router";

import Header from "@/components/header";
import { docsRoute } from "@/lib/i18n";
import { useDocsLocale } from "@/lib/use-locale";

const featureList = [
  {
    title: "Browser SSH",
    chineseTitle: "浏览器 SSH",
    chineseDetails: "直接在浏览器中连接 tailnet 内任意设备的终端，无需安装客户端。",
    details:
      "Open a terminal to any machine on the tailnet from the browser, with nothing to install.",
  },
  {
    title: "Single sign-on",
    chineseTitle: "单点登录",
    chineseDetails: "通过 OpenID Connect 提供商或反向代理登录，并为每个人分配角色。",
    details:
      "Sign people in through an OpenID Connect provider or a reverse proxy, each with a role.",
  },
  {
    title: "Machine details",
    chineseTitle: "设备详情",
    chineseDetails: "查看每台设备的 Tailscale 版本、操作系统和连接状态。",
    details: "See each machine's Tailscale version, operating system and connectivity.",
  },
  {
    title: "Headscale settings",
    chineseTitle: "Headscale 设置",
    chineseDetails: "在界面中修改 DNS 和登录限制，无需手动编辑 Headscale 配置文件。",
    details: "Edit DNS and sign-in restrictions from the UI instead of Headscale's config file.",
  },
];

export function meta({ location }: { location: { pathname: string } }) {
  return [
    { title: "Headplane" },
    {
      name: "description",
      content:
        docsRoute(location.pathname).locale === "zh-CN"
          ? "Headscale 的 Web 管理界面，为自托管 Tailscale 控制服务器提供可视化管理。"
          : "A web UI for Headscale, the self-hosted Tailscale control server.",
    },
  ];
}

export default function Home() {
  const { t, href } = useDocsLocale();
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-24">
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight">Headplane</h1>
          <p className="text-muted text-lg">
            {t(
              "A web UI for Headscale, the self-hosted Tailscale control server.",
              "Headscale 的 Web 管理界面，为自托管 Tailscale 控制服务器提供可视化管理。",
            )}
          </p>
          <div className="flex gap-2 pt-2">
            <Link
              className="bg-ink text-ink-fg hover:bg-ink/90 rounded-md px-3 py-1.5 text-sm font-medium"
              to={href("/introduction")}
            >
              {t("Get started", "开始使用")}
            </Link>
            <Link
              className="border-line-strong bg-surface hover:bg-hover rounded-md border px-3 py-1.5 text-sm font-medium"
              to={href("/install")}
            >
              {t("Installation", "安装")}
            </Link>
          </div>
        </div>
        <div className="border-line bg-line grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
          {featureList.map((feature) => (
            <div className="bg-surface flex flex-col gap-1 p-6" key={feature.title}>
              <h2 className="font-medium">{t(feature.title, feature.chineseTitle)}</h2>
              <p className="text-muted text-sm">{t(feature.details, feature.chineseDetails)}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
