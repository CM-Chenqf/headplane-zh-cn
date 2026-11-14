import type { Locale } from "./locale";
import { createTranslator, type MessageKey } from "./messages";

// CodeMirror owns these phrase IDs and interpolates its own `$` placeholders.
const phraseKeys = {
  Find: "editor.find",
  Replace: "editor.replaceField",
  next: "editor.next",
  previous: "editor.previous",
  all: "editor.all",
  "match case": "editor.matchCase",
  regexp: "editor.regexp",
  "by word": "editor.byWord",
  replace: "editor.replace",
  "replace all": "editor.replaceAll",
  close: "editor.close",
  "Go to line": "editor.goToLine",
  go: "editor.go",
  "replaced match on line $": "editor.replacedLine",
  "replaced $ matches": "editor.replacedMatches",
  "current match": "editor.currentMatch",
  "on line": "editor.onLine",
  Diagnostics: "editor.diagnostics",
  "No diagnostics": "editor.noDiagnostics",
  "Selection deleted": "editor.selectionDeleted",
  "$ unchanged lines": "editor.unchangedLines",
  "Revert this chunk": "editor.revertChunk",
  Accept: "editor.accept",
  Reject: "editor.reject",
  "Folded lines": "editor.foldedLines",
  "Unfolded lines": "editor.unfoldedLines",
  to: "editor.to",
  "folded code": "editor.foldedCode",
  unfold: "editor.unfold",
  "Fold line": "editor.foldLine",
  "Unfold line": "editor.unfoldLine",
  Completions: "editor.completions",
  "Control character": "editor.controlCharacter",
} as const satisfies Record<string, MessageKey>;

export function editorPhrases(locale: Locale): Record<string, string> {
  const t = createTranslator(locale);
  return Object.fromEntries(Object.entries(phraseKeys).map(([phrase, key]) => [phrase, t(key)]));
}
