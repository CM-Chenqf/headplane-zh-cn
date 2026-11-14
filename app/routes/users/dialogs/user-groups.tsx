import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Callout from "~/components/callout";
import Code from "~/components/code";
import Link from "~/components/link";
import TokenList from "~/components/token-list";
import { Message, useI18n } from "~/i18n/provider";
import { isValidGroupName } from "~/utils/acl-policy";

interface UserGroupsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // The Headscale username, which is what the ACL policy references.
  userName: string;
  displayName: string;
  groups: string[];
  availableGroups: string[];
  // Whether the stored policy contains HuJSON comments, which saving drops.
  policyHasComments?: boolean;
}

export default function UserGroups({
  isOpen,
  setIsOpen,
  userName,
  displayName,
  groups,
  availableGroups,
  policyHasComments,
}: UserGroupsProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState([...groups]);
  const isUnchanged =
    selected.length === groups.length && selected.every((group) => groups.includes(group));

  return (
    <ActionDialog
      description={
        <Message
          id="users.groupsDescription"
          values={{
            section: <Code>groups</Code>,
            docs: (
              <Link external styled to="https://tailscale.com/kb/1018/acls">
                {t("common.docs")}
              </Link>
            ),
          }}
        />
      }
      fields={{ user_name: userName }}
      intent="update_groups"
      isDisabled={isUnchanged}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={t("users.saveGroups")}
      title={t("users.groupsTitle", { name: displayName })}
    >
      {selected.map((group) => (
        <input key={group} name="groups" type="hidden" value={group} />
      ))}
      <TokenList
        emptyText={t("users.noGroups")}
        label={t("users.groups")}
        onChange={setSelected}
        placeholder="group:example"
        suggestions={availableGroups}
        validate={isValidGroupName}
        values={selected}
      />
      {policyHasComments && <Callout variant="warning">{t("users.policyComments")}</Callout>}
    </ActionDialog>
  );
}
