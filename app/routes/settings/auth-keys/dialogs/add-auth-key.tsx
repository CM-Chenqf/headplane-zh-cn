import { Plus } from "lucide-react";
import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Callout from "~/components/callout";
import CodeBlock from "~/components/code-block";
import { DialogDescription, DialogTitle } from "~/components/dialog";
import Link from "~/components/link";
import NumberInput from "~/components/number-input";
import Select from "~/components/select";
import { SwitchField } from "~/components/switch";
import TokenList from "~/components/token-list";
import { Message, useI18n } from "~/i18n/provider";
import type { User } from "~/types";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

interface AddAuthKeyProps {
  users: User[];
  url: string;
  selfServiceOnly: boolean;
  currentHeadscaleUserId?: string;
  currentSubject?: string;
}

function findCurrentUser(
  users: User[],
  headscaleUserId: string | undefined,
  subject: string | undefined,
): User | undefined {
  if (headscaleUserId) {
    const linked = users.find((u) => u.id === headscaleUserId);
    if (linked) {
      return linked;
    }
  }

  if (!subject) {
    return undefined;
  }
  return users.find((u) => {
    if (u.provider !== "oidc" || !u.providerId) {
      return false;
    }
    const segment = u.providerId.split("/").pop();
    return segment ? decodeURIComponent(segment) === subject : false;
  });
}

export default function AddAuthKey({
  users,
  url,
  selfServiceOnly,
  currentHeadscaleUserId,
  currentSubject,
}: AddAuthKeyProps) {
  const { t } = useI18n();
  const currentUser = selfServiceOnly
    ? findCurrentUser(users, currentHeadscaleUserId, currentSubject)
    : undefined;

  return (
    <ActionDialog
      description={t("authKeys.createDescription")}
      intent="create"
      isDisabled={selfServiceOnly && !currentUser}
      submitLabel={t("authKeys.create")}
      success={({ key }) => (
        <>
          <DialogTitle>{t("authKeys.createdTitle")}</DialogTitle>
          <DialogDescription>{t("authKeys.copyNow")}</DialogDescription>
          <CodeBlock>{key}</CodeBlock>
          <p className="text-muted">{t("authKeys.register")}</p>
          <CodeBlock>{`tailscale up --login-server=${url} --authkey ${key}`}</CodeBlock>
        </>
      )}
      title={t("authKeys.createTitle")}
      trigger={
        <Button variant="primary">
          <Plus className="size-3.5" />
          {t("authKeys.create")}
        </Button>
      }
    >
      <AuthKeyFields currentUser={currentUser} selfServiceOnly={selfServiceOnly} users={users} />
    </ActionDialog>
  );
}

interface AuthKeyFieldsProps {
  users: User[];
  selfServiceOnly: boolean;
  currentUser?: User;
}

// Kept separate so its state resets each time the dialog opens.
function AuthKeyFields({ users, selfServiceOnly, currentUser }: AuthKeyFieldsProps) {
  const { locale, t } = useI18n();
  const [isTagOnly, setIsTagOnly] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  if (selfServiceOnly && !currentUser) {
    return <Callout variant="warning">{t("authKeys.notLinked")}</Callout>;
  }

  return (
    <>
      {!selfServiceOnly && (
        <SwitchField
          checked={isTagOnly}
          description={t("authKeys.tagOnlyDescription")}
          label={t("authKeys.tagOnly")}
          onCheckedChange={setIsTagOnly}
        />
      )}
      {!isTagOnly &&
        (currentUser ? (
          <>
            <input name="user_id" type="hidden" value={currentUser.id} />
            <Select
              description={t("authKeys.ownUser")}
              disabled
              items={[{ value: currentUser.id, label: getUserDisplayName(currentUser, locale) }]}
              label={t("authKeys.user")}
              value={currentUser.id}
            />
          </>
        ) : (
          <Select
            defaultValue={sortUsersByDisplayName(users)[0]?.id ?? null}
            description={t("authKeys.userDescription")}
            items={sortUsersByDisplayName(users).map((user) => ({
              value: user.id,
              label: getUserDisplayName(user, locale),
            }))}
            label={t("authKeys.user")}
            name="user_id"
            placeholder={t("authKeys.selectUser")}
            required
          />
        ))}
      {tags.map((tag) => (
        <input key={tag} name="tags" type="hidden" value={tag} />
      ))}
      <TokenList
        emptyText={t(isTagOnly ? "authKeys.addTag" : "authKeys.noTags")}
        label={t("authKeys.tags")}
        normalize={(value) => (value.startsWith("tag:") ? value : `tag:${value}`)}
        onChange={setTags}
        placeholder="tag:server"
        validate={(value) => /^tag:\S+$/.test(value)}
        values={tags}
      />
      <NumberInput
        defaultValue={90}
        label={t("authKeys.expiryDays")}
        max={365_000}
        min={1}
        name="expiry"
        required
      />
      <SwitchField
        description={t("authKeys.reusableDescription")}
        label={t("authKeys.reusable")}
        name="reusable"
      />
      <SwitchField
        description={
          <Message
            id="authKeys.ephemeralDescription"
            values={{
              docs: (
                <Link external styled to="https://tailscale.com/kb/1111/ephemeral-nodes">
                  {t("common.docs")}
                </Link>
              ),
            }}
          />
        }
        label={t("authKeys.ephemeral")}
        name="ephemeral"
      />
    </>
  );
}
