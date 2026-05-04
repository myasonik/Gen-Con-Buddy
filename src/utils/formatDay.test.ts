import { expect, test } from "vitest";
import { formatDay, formatDayCompact } from "./formatDay";

// 2024-08-01T10:00:00Z = Thu Aug 1 2024 06:00 Indianapolis (UTC-4)
const DATE = new Date("2024-08-01T10:00:00Z");

test("formatDay day returns full weekday name", () => {
  expect(formatDay(DATE, "day")).toBe("Thursday");
});

test("formatDay numeric returns MM/dd/yy", () => {
  expect(formatDay(DATE, "numeric")).toBe("08/01/24");
});

test("formatDay long returns EEE, MMM dd, yyyy", () => {
  expect(formatDay(DATE, "long")).toBe("Thu, Aug 01, 2024");
});

test("formatDayCompact day returns abbreviated weekday", () => {
  expect(formatDayCompact(DATE, "day")).toBe("Thu");
});

test("formatDayCompact numeric returns M/d", () => {
  expect(formatDayCompact(DATE, "numeric")).toBe("8/1");
});

test("formatDayCompact long returns EEE M/d", () => {
  expect(formatDayCompact(DATE, "long")).toBe("Thu 8/1");
});
