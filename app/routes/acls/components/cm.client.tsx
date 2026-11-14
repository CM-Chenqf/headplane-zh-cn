import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import * as shopify from "@shopify/lang-jsonc";
import CodeMirror, { EditorState } from "@uiw/react-codemirror";
import { BookCopy, Braces, CircleCheck, CircleDashed, CircleX } from "lucide-react";
import { useMemo } from "react";
import Merge from "react-codemirror-merge";
import { ErrorBoundary } from "react-error-boundary";

import Button from "~/components/button";
import { editorPhrases } from "~/i18n/editor";
import { useI18n } from "~/i18n/provider";
import { formatPolicy, parsePolicy } from "~/utils/acl-policy";
import cn from "~/utils/cn";

import { headplaneTheme } from "./theme";

interface EditorProps {
  isDisabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function Editor(props: EditorProps) {
  const { locale, t } = useI18n();
  const language = useMemo(() => EditorState.phrases.of(editorPhrases(locale)), [locale]);
  const policyLinter = useMemo(
    () =>
      linter((view): Diagnostic[] => {
        const parsed = parsePolicy(view.state.doc.toString(), locale);
        if (parsed.ok) return [];
        return parsed.diagnostics.map((diagnostic) => ({
          ...diagnostic,
          severity: "error",
          source: "HuJSON",
        }));
      }),
    [locale],
  );
  const isEmpty = props.value.trim().length === 0;
  const parsed = parsePolicy(props.value, locale);
  const status = !parsed.ok
    ? { Icon: CircleX, label: parsed.error, className: "text-bad" }
    : isEmpty
      ? { Icon: CircleDashed, label: t("acls.noPolicy"), className: "text-muted" }
      : { Icon: CircleCheck, label: t("acls.validHujson"), className: "text-ok" };

  return (
    <div className="text-sm">
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center gap-2.5 py-8">
            <CircleX />
            <p className="text-lg font-semibold">{t("acls.editorFailed")}</p>
          </div>
        }
      >
        <div className="border-line bg-surface flex items-center justify-between gap-4 border-b px-3 py-2">
          <div role="status" className={cn("flex min-w-0 items-center gap-2", status.className)}>
            <status.Icon className="size-4 shrink-0" />
            <span className="truncate">{status.label}</span>
          </div>
          <Button
            disabled={props.isDisabled || isEmpty || !parsed.ok}
            onClick={() => {
              const result = formatPolicy(props.value, locale);
              if (result.ok) props.onChange(result.value);
            }}
            size="sm"
            type="button"
          >
            <Braces className="size-4" />
            {t("acls.format")}
          </Button>
        </div>
        <CodeMirror
          editable={!props.isDisabled}
          extensions={[
            shopify.jsonc(),
            policyLinter,
            lintGutter(),
            language,
            EditorView.contentAttributes.of({ "aria-label": t("acls.editorLabel") }),
          ]}
          minHeight="24rem"
          maxHeight="var(--height-editor)"
          onChange={(value) => props.onChange(value)}
          readOnly={props.isDisabled}
          theme={headplaneTheme}
          value={props.value}
        />
      </ErrorBoundary>
    </div>
  );
}

interface DifferProps {
  left: string;
  right: string;
}

export function Differ(props: DifferProps) {
  const { locale, t } = useI18n();
  const language = useMemo(() => EditorState.phrases.of(editorPhrases(locale)), [locale]);
  return (
    <div className="text-sm">
      {props.left === props.right ? (
        <div className="flex flex-col items-center gap-2.5 py-8">
          <BookCopy />
          <p className="text-lg font-semibold">{t("acls.noChanges")}</p>
        </div>
      ) : (
        <div className="h-editor">
          <ErrorBoundary
            fallback={
              <div className="flex flex-col items-center gap-2.5 py-8">
                <CircleX />
                <p className="text-lg font-semibold">{t("acls.editorFailed")}</p>
              </div>
            }
          >
            <Merge orientation="a-b" theme={headplaneTheme}>
              <Merge.Original
                extensions={[
                  shopify.jsonc(),
                  language,
                  EditorView.contentAttributes.of({ "aria-label": t("acls.originalLabel") }),
                ]}
                readOnly
                value={props.left}
              />
              <Merge.Modified
                extensions={[
                  shopify.jsonc(),
                  language,
                  EditorView.contentAttributes.of({ "aria-label": t("acls.modifiedLabel") }),
                ]}
                readOnly
                value={props.right}
              />
            </Merge>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
