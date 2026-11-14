import ActionDialog from "~/components/action-dialog";
import Callout from "~/components/callout";
import Select from "~/components/select";
import { useI18n } from "~/i18n/provider";

interface LinkUserProps {
  headplaneUserId: string;
  displayName: string;
  headscaleUsers: { id: string; name: string }[];
  currentLink?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function LinkUser({
  headplaneUserId,
  displayName,
  headscaleUsers,
  currentLink,
  isOpen,
  setIsOpen,
}: LinkUserProps) {
  const { t } = useI18n();
  const hasChoices = headscaleUsers.length > 0;

  return (
    <ActionDialog
      description={t("users.linkDescription")}
      fields={{ headplane_user_id: headplaneUserId }}
      intent="link"
      isDisabled={!hasChoices}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("users.linkSubmit")}
      title={t("users.linkTitle", { name: displayName })}
    >
      {hasChoices ? (
        <Select
          defaultValue={currentLink ?? null}
          items={headscaleUsers.map((user) => ({
            value: user.id,
            label:
              user.id === currentLink ? t("users.currentLink", { name: user.name }) : user.name,
          }))}
          label={t("users.headscaleUser")}
          name="headscale_user_id"
          placeholder={t("users.selectHeadscaleUser")}
          required
        />
      ) : (
        <Callout>{t("users.noLinkChoices")}</Callout>
      )}
    </ActionDialog>
  );
}
