import { Link as RouterLink } from "react-router";

import Button from "~/components/button";
import Card from "~/components/card";
import LanguageSwitch from "~/components/language-switch";
import { useI18n } from "~/i18n/provider";

export default function Logout() {
  const { t } = useI18n();
  return (
    <div className="flex h-screen w-screen items-center justify-center px-4 sm:px-0">
      <Card className="max-w-md">
        <div className="flex items-start justify-between gap-2">
          <Card.Title>{t("logout.titleLegacy")}</Card.Title>
          <LanguageSwitch compact />
        </div>
        <Card.Text>{t("logout.descriptionLegacy")}</Card.Text>
        <RouterLink to="/login" prefetch="none" reloadDocument>
          <Button className="mt-8 w-full" variant="heavy">
            {t("logout.signIn")}
          </Button>
        </RouterLink>
      </Card>
    </div>
  );
}
