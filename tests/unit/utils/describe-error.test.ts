import { expect, test } from "vitest";

import { describeError } from "~/utils/describe-error";

function response(status: number, data: unknown) {
  return { status, statusText: "diagnostic status", data, internal: false };
}

test("Chinese error pages retain original permission and server explanations as details", () => {
  for (const status of [403, 500]) {
    const error = response(status, { message: "Access denied for subject abc" });
    const chinese = describeError(error, "zh-CN");
    expect(chinese.title).toBe(status === 403 ? "没有访问权限" : "发生错误");
    expect(chinese.description).toBe(
      status === 403 ? "请联系管理员获取访问权限。" : "服务器返回了 500。",
    );
    expect(chinese.details).toBe("Access denied for subject abc");
    expect(describeError(error).description).toBe("Access denied for subject abc");
  }
});

test("translated connection guidance keeps the request and root diagnostic intact", () => {
  const connection = response(503, {
    requestUrl: "GET http://headscale/api/v1/node",
    errorCode: "ECONNREFUSED",
    errorMessage: "connect ECONNREFUSED",
    extraData: null,
  });
  const info = describeError(connection, "zh-CN");
  expect(info.kind).toBe("connection");
  expect(info.description).toBe("请确认 Headscale 正在运行，且 Headplane 可以连接到它。");
  expect(info.details).toBe("GET http://headscale/api/v1/node\n\nconnect ECONNREFUSED");
  const nested = describeError(
    new Error("wrapper", { cause: new Error("root diagnostic") }),
    "zh-CN",
  );
  expect(nested.details).toBe("Error: root diagnostic");
  expect(nested.description).toContain("诊断信息");
});
