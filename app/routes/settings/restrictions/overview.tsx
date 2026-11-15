import { data } from "react-router";

import Callout from "~/components/callout";
import Link from "~/components/link";
import PageError from "~/components/page-error";
import PageHeader from "~/components/page-header";
import { getLocale } from "~/i18n/locale.server";
import { translate } from "~/i18n/messages";
import { Message, useI18n } from "~/i18n/provider";
import { authContext, headscaleConfigContext, integrationContext } from "~/server/context";
import { Capabilities } from "~/server/web/roles";
import { toastClientAction } from "~/utils/toast";

import type { Route } from "./+types/overview";
import { restrictionAction } from "./actions";
import RestrictionSection from "./restriction-section";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const headscaleConfig = context.get(headscaleConfigContext);

  const principal = await auth.requireCapability(request, Capabilities.read_users);

  const oidc = headscaleConfig.getOIDCConfig();
  if (!oidc) {
    throw data(translate(await getLocale(request), "restrictions.notConfigured"), {
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
    isAutoApplied: context.get(integrationContext) !== undefined,
  };
}

export const action = restrictionAction;
export const clientAction = toastClientAction;

export default function Page({
  loaderData: { access, writable, isAutoApplied, settings },
}: Route.ComponentProps) {
  const { t } = useI18n();
  const isDisabled = !writable || !access;

  return (
    <>
      <PageHeader
        isSubpage
        description={
          <Message
            id="restrictions.description"
            values={{
              docs: (
                <Link
                  external
                  styled
                  to="https://headscale.net/stable/ref/oidc/#basic-configuration"
                >
                  {t("common.docs")}
                </Link>
              ),
            }}
          />
        }
        title={t("restrictions.title")}
      />
      {isDisabled && (
        <Callout className="mb-6">
          {access ? t("restrictions.readOnly") : t("restrictions.noPermission")}
        </Callout>
      )}
      {!isDisabled && !isAutoApplied && (
        <Callout className="mb-6" variant="warning">
          <Message
            id="restrictions.restartNotice"
            values={{
              integration: (
                <Link external styled to="https://headplane.net/configuration/integrations">
                  {t("restrictions.integration")}
                </Link>
              ),
            }}
          />
        </Callout>
      )}
      <RestrictionSection isDisabled={isDisabled} type="domain" values={settings.domains} />
      <RestrictionSection isDisabled={isDisabled} type="group" values={settings.groups} />
      <RestrictionSection isDisabled={isDisabled} type="user" values={settings.users} />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useI18n();
  return <PageError error={error} page={t("restrictions.page")} />;
}
