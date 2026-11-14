import { expect, test } from "vitest";

import { getOSInfo, getTSVersion, isUpdateAvailable } from "~/utils/host-info";

test("translated missing host fields do not become versions or change update detection", () => {
  expect(getOSInfo({}, "zh-CN")).toBe("未知");
  expect(getTSVersion({}, "zh-CN")).toBe("未知");
  expect(isUpdateAvailable({}, "1.100.0")).toBe(false);
  const host = { OS: "linux", OSVersion: "6.12", IPNVersion: "1.98.2-t123-g456" };
  expect(getOSInfo(host, "zh-CN")).toBe("Linux 6.12");
  expect(getTSVersion(host, "zh-CN")).toBe("1.98.2");
  expect(isUpdateAvailable(host, "1.100.0")).toBe(true);
  expect(isUpdateAvailable(host, "1.98.9")).toBe(false);
});
