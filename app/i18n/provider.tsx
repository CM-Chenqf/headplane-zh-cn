import { createContext, Fragment, type ReactNode, useContext } from "react";

import { defaultLocale, type Locale } from "./locale";
import {
  messages,
  type MessageArgs,
  type MessageKey,
  type MessageValues,
  translate,
} from "./messages";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  const t = <K extends MessageKey>(key: K, ...args: MessageArgs<K>) =>
    translate(locale, key, ...args);
  return { locale, t };
}

// Keep inline code, names and other React content in a single reorderable
// sentence. React escapes substituted text; translations never contain HTML.
export function Message<K extends MessageKey>({
  id,
  values,
}: {
  id: K;
  values: MessageValues<K, ReactNode>;
}) {
  const { locale } = useI18n();
  return messages[locale][id]
    .split(/(\{\w+\})/g)
    .map((part, index) => (
      <Fragment key={index}>
        {part.startsWith("{") ? (values as Record<string, ReactNode>)[part.slice(1, -1)] : part}
      </Fragment>
    ));
}
