import { useState } from "react";

import Input from "~/components/input";
import Link from "~/components/link";
import TokenList from "~/components/token-list";
import { Message, useI18n } from "~/i18n/provider";
import { withDefaultPort, type AclRule } from "~/utils/acl-policy";

import EditorDialog from "./editor-dialog";

interface AclRuleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rule?: AclRule;
  sources: string[];
  destinations: string[];
  onSave: (rule: AclRule) => void;
}

const EMPTY: AclRule = { action: "accept", src: [], dst: [], extra: {} };

export default function AclRuleDialog({
  isOpen,
  setIsOpen,
  rule,
  sources,
  destinations,
  onSave,
}: AclRuleDialogProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<AclRule>(() => structuredClone(rule ?? EMPTY));

  const isInvalid = draft.src.length === 0 || draft.dst.length === 0;

  return (
    <EditorDialog
      description={
        <Message
          id="acls.ruleDescription"
          values={{
            example: <code className="font-mono">tag:web:80,443</code>,
            port: <code className="font-mono">:*</code>,
            docs: (
              <Link external styled to="https://tailscale.com/kb/1018/acls">
                {t("acls.tailscaleGuide")}
              </Link>
            ),
          }}
        />
      }
      isDisabled={isInvalid}
      isOpen={isOpen}
      onSubmit={() => {
        // A hand-written policy may be missing the port spec Headscale wants.
        onSave({ ...draft, dst: draft.dst.map(withDefaultPort) });
      }}
      setIsOpen={setIsOpen}
      submitLabel={t(rule ? "acls.updateRule" : "acls.addRule")}
      title={t(rule ? "acls.editAccessRule" : "acls.newAccessRule")}
    >
      <TokenList
        description={t("acls.sourcesDescription")}
        emptyText={t("acls.noSources")}
        label={t("acls.sources")}
        onChange={(src) => setDraft({ ...draft, src })}
        placeholder="group:eng"
        suggestions={sources}
        values={draft.src}
      />
      <TokenList
        description={t("acls.destinationsDescription")}
        emptyText={t("acls.noDestinations")}
        label={t("acls.destinations")}
        normalize={withDefaultPort}
        onChange={(dst) => setDraft({ ...draft, dst })}
        placeholder="tag:web:80,443"
        suggestions={destinations}
        values={draft.dst}
      />
      <Input
        description={t("acls.protocolDescription")}
        label={t("acls.protocol")}
        onChange={(proto) => setDraft({ ...draft, proto: proto.length > 0 ? proto : undefined })}
        placeholder="tcp"
        value={draft.proto ?? ""}
      />
    </EditorDialog>
  );
}
