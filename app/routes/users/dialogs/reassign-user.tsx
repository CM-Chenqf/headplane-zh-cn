import Dialog, { DialogPanel } from "~/components/dialog";
import Link from "~/components/link";
import Notice from "~/components/notice";
import RadioGroup from "~/components/radio-group";
import Text from "~/components/text";
import Title from "~/components/title";
import type { Locale } from "~/i18n/locale";
import { createTranslator } from "~/i18n/messages";
import { useI18n, Message } from "~/i18n/provider";
import { Roles } from "~/server/web/roles";
import type { Role } from "~/server/web/roles";

interface ReassignProps {
  headplaneUserId: string;
  displayName: string;
  role: Role;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ReassignUser({
  headplaneUserId,
  displayName,
  role,
  isOpen,
  setIsOpen,
}: ReassignProps) {
  const { t, locale } = useI18n();
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel variant={role === "owner" ? "unactionable" : "normal"}>
        <Title>{t("users.changeRoleTitle", { name: displayName })}</Title>
        <Text className="mb-6">
          <Message
            id="users.roleDescription"
            values={{
              docs: (
                <Link external styled to="https://tailscale.com/kb/1138/user-roles">
                  {t("common.learnMore")}
                </Link>
              ),
            }}
          />
        </Text>
        {role === "owner" ? (
          <Notice>{t("users.ownerRoleNotice")}</Notice>
        ) : (
          <>
            <input name="action_id" type="hidden" value="reassign_user" />
            <input name="headplane_user_id" type="hidden" value={headplaneUserId} />
            <RadioGroup
              className="gap-4"
              defaultValue={role}
              label={t("users.role")}
              name="new_role"
            >
              {Object.keys(Roles)
                .filter((r) => r !== "owner")
                .map((r) => {
                  const { name, desc } = mapRoleToName(r, locale);
                  return (
                    <RadioGroup.Radio key={r} label={name} value={r}>
                      <div className="block">
                        <p className="font-bold">{name}</p>
                        <p className="opacity-70">{desc}</p>
                      </div>
                    </RadioGroup.Radio>
                  );
                })}
            </RadioGroup>
          </>
        )}
      </DialogPanel>
    </Dialog>
  );
}

function mapRoleToName(role: string, locale: Locale) {
  const t = createTranslator(locale);
  switch (role) {
    case "admin":
      return {
        name: t("users.role.admin"),
        desc: t("users.roleDescription.admin"),
      };
    case "network_admin":
      return {
        name: t("users.role.network_admin"),
        desc: t("users.roleDescription.network_admin"),
      };
    case "it_admin":
      return {
        name: t("users.role.it_admin"),
        desc: t("users.roleDescription.it_admin"),
      };
    case "auditor":
      return {
        name: t("users.role.auditor"),
        desc: t("users.roleDescription.auditor"),
      };
    case "viewer":
      return {
        name: t("users.role.viewer"),
        desc: t("users.roleDescription.viewer"),
      };
    case "member":
      return {
        name: t("users.role.member"),
        desc: t("users.roleDescription.member"),
      };
    default:
      return {
        name: role,
        desc: t("users.noRoleDescription"),
      };
  }
}
