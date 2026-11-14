import { expect, test } from "vitest";

import { usernameSchema } from "~/routes/users/schemas";
import { fieldValidator, parseValues } from "~/utils/form";

// Localization must not replace Headscale's Unicode username rules with ASCII.
test.for(["en", "zh-CN"] as const)("%s preserves valid Unicode usernames", (locale) => {
  for (const name of ["中文用户", "josé", "alice@example.com", "user-1.name", "用户１２"]) {
    expect(parseValues(usernameSchema(locale), name)).toEqual({ ok: true, data: name });
    expect(fieldValidator(usernameSchema(locale))(name)).toBeNull();
  }
});

test.for([
  { locale: "en", error: "Enter a valid username." },
  { locale: "zh-CN", error: "请输入有效的用户名。" },
] as const)(
  "$locale returns the same client and server error for malformed names",
  ({ locale, error }) => {
    for (const value of [
      "a",
      "lm@",
      "a@b@c",
      "bad name",
      "ab²",
      ["alice", "bob"],
      new File(["alice"], "name.txt"),
      undefined,
    ]) {
      const result = parseValues(usernameSchema(locale), value);
      expect(result).toEqual({ ok: false, errors: { form: error } });
      expect(fieldValidator(usernameSchema(locale))(value)).toBe(error);
    }
  },
);
