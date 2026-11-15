import { afterEach, expect, test, vi } from "vitest";

import type { HostInfo } from "~/types";
import { getOSInfo, getTSVersion } from "~/utils/host-info";
import { formatTimeDelta } from "~/utils/time";

afterEach(() => vi.useRealTimers());

test("machine durations keep 0.8 thresholds and English wording while using Chinese units", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-15T10:00:00Z"));
  for (const [minutes, english, chinese] of [
    [0, "0 minutes ago", "0分钟前"],
    [1, "1 minute ago", "1分钟前"],
    [59, "59 minutes ago", "59分钟前"],
    [60, "1 hour ago", "1小时前"],
    [61, "1 hour, 1 minute ago", "1小时1分钟前"],
    [1440, "1 day ago", "1天前"],
    [1500, "1 day, 1 hour ago", "1天1小时前"],
    [43200, "1 month ago", "1个月前"],
    [44640, "1 month, 1 day ago", "1个月1天前"],
  ] as const) {
    const date = new Date(Date.now() - minutes * 60_000);
    expect(formatTimeDelta(date)).toBe(english);
    expect(formatTimeDelta(date, "en")).toBe(english);
    expect(formatTimeDelta(date, "zh-CN")).toBe(chinese);
  }
});

test("missing machine information follows the selected language without translating reported values", () => {
  const missing = {} as HostInfo;
  expect(getOSInfo(missing, "zh-CN")).toBe("未知");
  expect(getTSVersion(missing, "zh-CN")).toBe("未知");
  expect(getOSInfo(missing)).toBe("Unknown");
  expect(getTSVersion(missing)).toBe("Unknown");
  const reported = {
    OS: "custom-system",
    OSVersion: "7.1",
    IPNVersion: "1.88.0-custom",
  } as HostInfo;
  for (const locale of ["en", "zh-CN"] as const) {
    expect(getOSInfo(reported, locale)).toBe("custom-system 7.1");
    expect(getTSVersion(reported, locale)).toBe("1.88.0");
  }
});
