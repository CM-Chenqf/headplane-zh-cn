import { NavLink, Outlet } from "react-router";

import PageHeader from "~/components/page-header";
import { useI18n } from "~/i18n/provider";
import { authContext, headscaleConfigContext } from "~/server/context";
import cn from "~/utils/cn";

import type { Route } from "./+types/layout";

export async function loader({ request, context }: Route.LoaderArgs) {
  await context.get(authContext).require(request);
  const headscaleConfig = context.get(headscaleConfigContext);

  return {
    hasRestrictions: headscaleConfig.writable() && headscaleConfig.hasOIDCConfig(),
  };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const { t } = useI18n();
  const items = [
    { to: "/settings/auth-keys", label: t("authKeys.title") },
    ...(loaderData.hasRestrictions
      ? [{ to: "/settings/restrictions", label: t("restrictions.title") }]
      : []),
    { to: "/settings/agent", label: t("agent.title") },
  ];

  return (
    <>
      <PageHeader description={t("settings.description")} title={t("settings.title")} />
      <div className="grid gap-x-12 gap-y-6 md:grid-cols-[11rem_minmax(0,1fr)]">
        <nav aria-label={t("settings.title")} className="min-w-0">
          <ul className="-mx-2 flex gap-1 overflow-x-auto md:mx-0 md:flex-col">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "focus-ring flex h-8 items-center rounded-md px-2 text-sm whitespace-nowrap",
                      isActive
                        ? "bg-subtle text-fg font-medium"
                        : "text-muted hover:bg-hover hover:text-fg",
                    )
                  }
                  prefetch="intent"
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  );
}
