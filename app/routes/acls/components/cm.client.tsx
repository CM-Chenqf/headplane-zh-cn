import { EditorView } from "@codemirror/view";
import * as shopify from "@shopify/lang-jsonc";
import CodeMirror, { EditorState } from "@uiw/react-codemirror";
import { BookCopy, CircleX } from "lucide-react";
import { useMemo } from "react";
import Merge from "react-codemirror-merge";
import { ErrorBoundary } from "react-error-boundary";

import { editorPhrases } from "~/i18n/editor";
import { useI18n } from "~/i18n/provider";

import { headplaneTheme } from "./theme";

interface EditorProps {
  isDisabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function Editor(props: EditorProps) {
  const { locale, t } = useI18n();
  const language = useMemo(() => EditorState.phrases.of(editorPhrases(locale)), [locale]);
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
        <CodeMirror
          editable={!props.isDisabled}
          extensions={[
            shopify.jsonc(),
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
