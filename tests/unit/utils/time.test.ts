import { afterEach, expect, test, vi } from "vitest";

import { formatDateTime, formatTimeDelta, formatTimeUntil } from "~/utils/time";

afterEach(() => vi.useRealTimers());

test("relative times use each caller's language, including the sub-minute case", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-20T12:00:00Z"));
  expect(formatTimeDelta(new Date(Date.now() - 3 * 3600_000), "zh-CN")).toBe("3小时前");
  expect(formatTimeDelta(new Date(Date.now() - 3 * 3600_000), "en")).toBe("3 hours ago");
  expect(formatTimeUntil(new Date(Date.now() + 4 * 86400_000), "zh-CN")).toBe("4天后");
  expect(formatTimeUntil(new Date(Date.now() + 4 * 86400_000))).toBe("in 4 days");
  expect(formatTimeDelta(new Date(Date.now() - 15_000), "zh-CN")).toBe("刚刚");
  expect(formatTimeUntil(new Date(Date.now() + 15_000), "zh-CN")).toBe("现在");
  expect(formatTimeDelta(new Date())).toBe("just now");
});

test("calendar dates follow the selected language rather than the machine locale", () => {
  const date = new Date(2026, 0, 20, 15, 4, 5);
  expect(formatDateTime(date, "zh-CN")).toContain("2026/1/20");
  expect(formatDateTime(date, "en")).toContain("1/20/2026");
});
