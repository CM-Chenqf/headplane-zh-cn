import type { ActionFunctionArgs } from "react-router";
import * as v from "valibot";

import type { Locale } from "~/i18n/locale";
import { getLocale } from "~/i18n/locale.server";
import { createTranslator } from "~/i18n/messages";
import {
  authContext,
  headscaleConfigContext,
  headscaleContext,
  integrationContext,
} from "~/server/context";
import { ActionError, createAction } from "~/server/web/actions";
import { Capabilities } from "~/server/web/roles";
import { invalid, ok, parseValues } from "~/utils/form";

import { restrictionSchemas, restrictionTypes, type RestrictionType } from "./schemas";

const configPaths = {
  domain: { path: "oidc.allowed_domains", key: "allowedDomains" },
  group: { path: "oidc.allowed_groups", key: "allowedGroups" },
  user: { path: "oidc.allowed_users", key: "allowedUsers" },
} as const;

function createRestrictionAction(locale: Locale) {
  const t = createTranslator(locale);
  const restrictionValue = restrictionSchemas(locale);
  const fields = {
    type: v.picklist(restrictionTypes, t("restrictions.validation.type")),
    value: v.string(t("validation.required")),
  };
  return createAction({
    locale,
    validationMessage: t("validation.required"),
    capability: Capabilities.configure_iam,
    async setup({ request, context }) {
      const principal = await context.get(authContext).require(request);
      const headscale = context.get(headscaleContext);
      const config = context.get(headscaleConfigContext);
      const integration = context.get(integrationContext);
      if (!config.writable()) {
        throw new ActionError(t("restrictions.error.readOnly"), 403);
      }

      function current(type: RestrictionType) {
        return config.getOIDCConfig()?.[configPaths[type].key] ?? [];
      }

      async function save(type: RestrictionType, values: string[]) {
        await config.patch([{ path: configPaths[type].path, value: values }]);
        if (integration && !(await integration.onConfigChange(headscale))) {
          throw new ActionError(t("restrictions.error.restart"), 502);
        }
      }

      return { principal, current, save };
    },
    intents: {
      add: {
        fields,
        async handler(input, { current, save }) {
          const value = parseValues(restrictionValue[input.type], input.value);
          if (!value.ok) {
            return invalid({ value: value.errors.form });
          }

          const values = current(input.type);
          if (values.includes(value.data)) {
            return invalid({ value: t(`restrictions.${input.type}.duplicate`) });
          }

          await save(input.type, [...values, value.data]);
          return ok(t(`restrictions.${input.type}.added`));
        },
      },
      remove: {
        fields,
        async handler(input, { current, save }) {
          const values = current(input.type);
          if (!values.includes(input.value)) {
            throw new ActionError(t(`restrictions.${input.type}.missing`));
          }

          await save(
            input.type,
            values.filter((value) => value !== input.value),
          );
          return ok(t(`restrictions.${input.type}.removed`));
        },
      },
    },
  });
}

const localizedActions = {
  en: createRestrictionAction("en"),
  "zh-CN": createRestrictionAction("zh-CN"),
};

export const restrictionAction = Object.assign(
  async (args: ActionFunctionArgs) => localizedActions[await getLocale(args.request)](args),
  { intents: localizedActions.en.intents },
);
