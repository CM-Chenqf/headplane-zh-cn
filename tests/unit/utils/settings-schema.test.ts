import { expect, test } from "vitest";

import { agentError, agentReason } from "~/i18n/agent";
import { restrictionSchemas } from "~/routes/settings/restrictions/schemas";
import { fieldValidator, parseValues } from "~/utils/form";

test.for(["en", "zh-CN"] as const)(
  "%s restriction validation preserves hostname rules and trims identity values",
  (locale) => {
    const schemas = restrictionSchemas(locale);
    expect(parseValues(schemas.domain, " example.com ")).toEqual({ ok: true, data: "example.com" });
    for (const value of [
      "https://example.com",
      "example.com/path",
      "example.com:80",
      "Example.COM",
    ]) {
      const message =
        locale === "en" ? "Enter a domain like example.com." : "请输入类似 example.com 的域名。";
      expect(parseValues(schemas.domain, value)).toEqual({ ok: false, errors: { form: message } });
      expect(fieldValidator(schemas.domain)(value)).toBe(message);
    }
    for (const [type, value] of [
      ["group", " team:研发 "],
      ["user", " Alice@example.com "],
    ] as const) {
      expect(parseValues(schemas[type], value)).toEqual({ ok: true, data: value.trim() });
    }
    for (const type of ["domain", "group", "user"] as const) {
      const message =
        locale === "en"
          ? `Enter a ${type}.`
          : { domain: "请输入域名。", group: "请输入用户组。", user: "请输入用户。" }[type];
      for (const value of [" ", ["example.com"], undefined]) {
        expect(parseValues(schemas[type], value)).toEqual({ ok: false, errors: { form: message } });
        expect(fieldValidator(schemas[type])(value)).toBe(message);
      }
    }
  },
);

test("agent diagnostics retain actionable original details and unknown upstream reasons", () => {
  const timeout = "The agent didn't answer in time";
  expect(agentError(timeout, "zh-CN")).toBe(`Agent 响应超时。原始详情：${timeout}`);
  expect(agentError(timeout, "en")).toBe(timeout);
  const unknown = "worker: read E:/operator/agent.state: EACCES (13)";
  expect(agentError(unknown, "zh-CN")).toBe(`同步失败。原始详情：${unknown}`);
  expect(agentReason(unknown, "zh-CN")).toBe(`Agent 不可用。原始详情：${unknown}`);
  expect(agentReason(unknown, "en")).toBe(unknown);
});
