import en from "./en";
import { type Locale } from "./locale";
import zhCN from "./zh-CN";

export type MessageKey = keyof typeof en;
type Placeholders<S extends string> = S extends `${string}{${infer Key}}${infer Rest}`
  ? Key | Placeholders<Rest>
  : never;
export type MessageValues<K extends MessageKey, Value = string | number> = Record<
  Placeholders<(typeof en)[K]>,
  Value
>;
export type MessageArgs<K extends MessageKey> = [Placeholders<(typeof en)[K]>] extends [never]
  ? []
  : [values: MessageValues<K>];

export const messages = { en, "zh-CN": zhCN } satisfies Record<Locale, Record<MessageKey, string>>;

export function translate<K extends MessageKey>(
  locale: Locale,
  key: K,
  ...args: MessageArgs<K>
): string {
  const values = args[0] as Record<string, string | number> | undefined;
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values?.[name] ?? `{${name}}`),
  );
}
