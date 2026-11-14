import { Link as RouterLink } from "react-router";

import Button from "~/components/button";
import { useI18n } from "~/i18n/provider";

import Shell from "./shell";

export default function Logout() {
  const { t } = useI18n();
  return (
    <Shell description={t("logout.description")} title={t("logout.title")}>
      <Button
        className="w-full"
        nativeButton={false}
        render={<RouterLink prefetch="none" reloadDocument to="/login" />}
        variant="primary"
      >
        {t("logout.signIn")}
      </Button>
    </Shell>
  );
}
