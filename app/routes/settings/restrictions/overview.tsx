import { data } from "react-router";

import Link from "~/components/link";
import Notice from "~/components/notice";
import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import { useI18n } from "~/i18n/provider";
import { authContext, headscaleConfigContext } from "~/server/context";
import { Capabilities } from "~/server/web/roles";

import type { Route } from "./+types/overview";
import { restrictionAction } from "./actions";
import AddDomain from "./dialogs/add-domain";
import AddGroup from "./dialogs/add-group";
import AddUser from "./dialogs/add-user";
import RestrictionTable from "./table";

export async function loader({ request, context }: Route.LoaderArgs) {
  const t = createTranslator(await getLocale(request));
  const auth = context.get(authContext);
  const headscaleConfig = context.get(headscaleConfigContext);

  const principal = await auth.require(request);
  const check = auth.can(principal, Capabilities.read_users);
  if (!check) {
    throw data(t("restrictions.error.view"), {
      status: 403,
    });
  }

  const oidc = headscaleConfig.getOIDCConfig();
  if (!oidc) {
    throw data(t("restrictions.error.oidc"), {
      status: 501,
    });
  }

  return {
    access: auth.can(principal, Capabilities.configure_iam),
    settings: {
      domains: [...new Set(oidc.allowedDomains)],
      groups: [...new Set(oidc.allowedGroups)],
      users: [...new Set(oidc.allowedUsers)],
    },
    writable: headscaleConfig.writable(),
  };
}

export const action = restrictionAction;

export default function Page({ loaderData: { access, writable, settings } }: Route.ComponentProps) {
  const { t } = useI18n();
  const isDisabled = writable ? !access : true;

  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
      <div className="flex w-full flex-col sm:w-2/3">
        <p className="text-md mb-4">
          <Link className="font-medium" to="/settings">
            {t("settings.title")}
          </Link>
          <span className="mx-2">/</span> {t("restrictions.title")}
        </p>
        {!access ? (
          <Notice title={t("restrictions.restricted")} variant="warning">
            {t("restrictions.noPermission")}
          </Notice>
        ) : !writable ? (
          <Notice title={t("restrictions.locked")} variant="error">
            {t("restrictions.readOnly")}
          </Notice>
        ) : undefined}
        <h1 className="mt-4 mb-2 text-2xl font-medium">{t("restrictions.title")}</h1>
        <p>
          {t("restrictions.description")}{" "}
          <Link external styled to="https://headscale.net/stable/ref/oidc/#basic-configuration">
            {t("common.learnMore")}
          </Link>
        </p>
      </div>
      <RestrictionTable isDisabled={isDisabled} type="domain" values={settings.domains}>
        <AddDomain domains={settings.domains} isDisabled={isDisabled} />
      </RestrictionTable>
      <RestrictionTable isDisabled={isDisabled} type="group" values={settings.groups}>
        <AddGroup groups={settings.groups} isDisabled={isDisabled} />
      </RestrictionTable>
      <RestrictionTable isDisabled={isDisabled} type="user" values={settings.users}>
        <AddUser isDisabled={isDisabled} users={settings.users} />
      </RestrictionTable>
    </div>
  );
}
