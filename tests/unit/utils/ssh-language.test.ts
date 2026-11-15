import { describe, expect, test } from "vitest";

import {
  isSSHError,
  localizeSSHError,
  sshErrors,
  sshStatus,
  type SSHConnectionStatus,
} from "~/i18n/ssh";

describe("SSH language changes without creating a new session", () => {
  test("an existing loader error can change language while preserving its hostname and docs anchor", () => {
    const hostname = "server-研发.{hostname}<script>";
    const original = sshErrors("en").node_not_found(hostname);
    const chinese = localizeSSHError(original, "zh-CN");
    expect(chinese).toMatchObject({
      code: "node_not_found",
      hostname,
      anchor: original.anchor,
      title: "未找到设备",
      message: `没有名为 ${hostname} 的设备。设备可能已重命名或移除。`,
    });
    expect(localizeSSHError(chinese, "en")).toEqual(original);
    expect(original.message).toBe(
      `There's no machine named ${hostname}. It may have been renamed or removed.`,
    );
  });

  test("old and unfamiliar error details are preserved instead of replaced with an unrelated error", () => {
    const legacy = { title: "Upstream failure", message: "details: 502", anchor: "#new-error" };
    const future = { ...legacy, code: "future_error" };
    const incomplete = { ...legacy, code: "node_not_found", hostname: 42 };
    for (const error of [legacy, future, incomplete]) {
      expect(isSSHError(error)).toBe(true);
      // The compatibility guard accepts the original three strings, even if
      // optional metadata from another version has an unfamiliar shape.
      if (isSSHError(error)) expect(localizeSSHError(error, "zh-CN")).toBe(error);
    }
    for (const error of [null, "error", new Error("failure"), { ...legacy, message: null }]) {
      expect(isSSHError(error)).toBe(false);
    }
  });

  test("the same connection state renders in either language without storing translated status", () => {
    const status: SSHConnectionStatus = { kind: "connecting" };
    expect(sshStatus(status, "server-研发", "zh-CN")).toBe("正在连接到 server-研发…");
    expect(sshStatus(status, "server-研发", "en")).toBe("Connecting to server-研发…");
    expect(status).toEqual({ kind: "connecting" });
  });

  test("known connection failures keep their original diagnostics when explained in Chinese", () => {
    const status: SSHConnectionStatus = {
      kind: "failed",
      error: "Headscale rejected the auth key",
    };
    expect(sshStatus(status, "server", "zh-CN")).toBe(
      "加入 Tailnet 失败：Headscale 拒绝了认证密钥。原始详情：Headscale rejected the auth key",
    );
    expect(sshStatus(status, "server", "en")).toBe(
      "Failed to join Tailnet: Headscale rejected the auth key",
    );
    expect(sshStatus({ kind: "stopped", error: "Unexpected shutdown" }, "server", "zh-CN")).toBe(
      "Tailnet 节点已停止：意外关闭。原始详情：Unexpected shutdown",
    );
  });

  test("unknown diagnostics, addresses and tokens are passed through verbatim", () => {
    const error = 'WebSocket /ts2021: 405 Method Not Allowed; host="server-研发" {error}';
    const status: SSHConnectionStatus = { kind: "failed", error };
    expect(sshStatus(status, "server", "zh-CN")).toBe(`加入 Tailnet 失败：${error}`);
    expect(sshStatus(status, "server", "en")).toBe(`Failed to join Tailnet: ${error}`);
  });
});
