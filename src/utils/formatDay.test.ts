import { expect, test } from "vitest";
import { format } from "date-fns";
import { formatDay, formatDayCompact, toDisplayDate } from "./formatDay";

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

// toDisplayDate tests
// TZ=America/Indianapolis is pinned in tests (see src/test/setup.ts), so "indy" and "local"
// resolve to the same value in this environment. The TZDate used for "indy" is what ensures
// correctness for UTC+ users in production.

// "2024-08-01T10:00:00-04:00" is explicitly 10am Indianapolis time.
const INDY_10AM = "2024-08-01T10:00:00-04:00";

test('toDisplayDate "indy" formats explicit Indianapolis offset to 10:00', () => {
  const d = toDisplayDate(INDY_10AM, "indy");
  expect(format(d, "HH:mm")).toBe("10:00");
});

test('toDisplayDate "local" formats explicit Indianapolis offset to 10:00 (TZ pinned in tests)', () => {
  const d = toDisplayDate(INDY_10AM, "local");
  expect(format(d, "HH:mm")).toBe("10:00");
});

test('toDisplayDate "indy" assigns correct Indianapolis day for near-midnight UTC', () => {
  // "2024-08-02T02:00:00Z" = 10pm Indianapolis Aug 1 (UTC-4)
  const d = toDisplayDate("2024-08-02T02:00:00Z", "indy");
  expect(format(d, "yyyy-MM-dd")).toBe("2024-08-01");
});

test('toDisplayDate "indy" works correctly with formatDay', () => {
  const d = toDisplayDate(INDY_10AM, "indy");
  expect(formatDay(d, "day")).toBe("Thursday");
});
