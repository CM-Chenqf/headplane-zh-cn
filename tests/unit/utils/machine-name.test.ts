import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { machineNameSchema } from "~/routes/machines/schemas";
import { fieldValidator, parseValues } from "~/utils/form";

describe.each(["en", "zh-CN"] as const)("machine names in %s", (locale) => {
  test("language selection preserves DNS label rules and the 63 character limit", () => {
    const schema = machineNameSchema(locale);
    for (const name of ["a", "9", "Office-PC", "a".repeat(63)]) {
      expect(v.parse(schema, name)).toBe(name);
    }
    for (const name of ["", "-pc", "pc-", "my pc", "pc.local", "pc_1", "电脑", "a".repeat(64)]) {
      expect(v.safeParse(schema, name).success, name).toBe(false);
    }
  });

  test("client and server reject malformed values in the same selected language", () => {
    const schema = machineNameSchema(locale);
    const expected =
      locale === "en"
        ? "Use letters, numbers, and hyphens only, starting and ending with a letter or number."
        : "只能使用英文字母、数字和连字符，且必须以字母或数字开头和结尾。";
    expect(fieldValidator(schema)("bad name")).toBe(expected);
    for (const name of [undefined, ["valid", "another"], new File([], "name"), "bad name"]) {
      expect(parseValues(v.object({ name: schema }), { name })).toEqual({
        ok: false,
        errors: { name: expected },
      });
    }
  });
});
