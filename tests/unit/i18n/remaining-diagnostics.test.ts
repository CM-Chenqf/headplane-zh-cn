import { describe, expect, test } from "vitest";

import { agentError, agentReason } from "~/i18n/agent";
import { localizeSSHError, sshErrors, sshStatus } from "~/i18n/ssh";

describe("release-line diagnostics across language changes", () => {
  test("translates the actual 0.8 WASM failures while preserving raw diagnostics", () => {
    for (const raw of [
      "Headscale rejected the pre-auth key",
      "Failed to load Go WASM helper",
      "Unexpected shutdown",
    ]) {
      const status = { kind: "failed" as const, error: raw };
      expect(sshStatus(status, "server", "zh-CN")).toMatch(/加入 Tailnet 失败/);
      expect(sshStatus(status, "server", "zh-CN")).toContain(`原始详情：${raw}`);
      expect(sshStatus(status, "server", "en")).toContain(raw);
    }
    expect(
      sshStatus({ kind: "stopped", error: "remote: permission denied" }, "server", "zh-CN"),
    ).toContain("remote: permission denied");
  });

  test("retranslates loader errors from stable metadata without rerunning the loader", () => {
    const english = sshErrors("en").node_not_found("server");
    const chinese = localizeSSHError(english, "zh-CN");
    expect(chinese.message).toContain("server");
    expect(chinese.message).not.toBe(english.message);
    expect(chinese.anchor).toBe(english.anchor);
    expect(localizeSSHError(chinese, "en")).toEqual(english);
  });

  test("matches old Agent timeouts and retains unknown diagnostics", () => {
    const raw = "Headscale didn't delete a node in time";
    expect(agentError(raw, "zh-CN")).toContain(`Headscale 删除节点超时。原始详情：${raw}`);
    expect(agentError("socket: ECONNREFUSED", "zh-CN")).toContain("socket: ECONNREFUSED");
    expect(agentReason("Agent requires Headscale 0.28 or newer", "zh-CN")).toContain("0.28");
  });
});
