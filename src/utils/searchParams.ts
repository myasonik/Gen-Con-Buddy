import { parseCSV } from "./parseCSV";

// Update this each year once new event data is loaded. Gen Con always runs Wed–Sun in late July/early August.
export const GEN_CON_YEAR = 2026;

function genConWednesday(year: number): Date {
  const aug1 = new Date(year, 7, 1);
  const daysBack = (aug1.getDay() - 3 + 7) % 7;
  return new Date(year, 7, 1 - daysBack);
}

function offsetDateTime(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T00:00:00-04:00`;
}

const wed = genConWednesday(GEN_CON_YEAR);
export const DAY_DATES: Record<string, { start: string; end: string }> = {
  wed: { start: offsetDateTime(wed, 0), end: offsetDateTime(wed, 1) },
  thu: { start: offsetDateTime(wed, 1), end: offsetDateTime(wed, 2) },
  fri: { start: offsetDateTime(wed, 2), end: offsetDateTime(wed, 3) },
  sat: { start: offsetDateTime(wed, 3), end: offsetDateTime(wed, 4) },
  sun: { start: offsetDateTime(wed, 4), end: offsetDateTime(wed, 5) },
};

/**
 * Convert day codes (e.g. "thu,fri") and optional HH:MM time bounds into the
 * bracket-range syntax the API expects for startDateTime.
 *
 * When timeStart/timeEnd are provided, each selected day gets a time-windowed
 * range: [2026-07-30T09:00:00-04:00,2026-07-30T17:00:00-04:00]
 * When omitted, each day gets its full midnight-to-midnight range.
 */
export function daysAndTimeToStartDateTime(
  days: string,
  timeStart?: string,
  timeEnd?: string,
): string | undefined {
  const dayList = days.split(",").filter((d) => DAY_DATES[d]);
  if (dayList.length === 0) {
    return undefined;
  }

  const ranges = dayList.map((d) => {
    const dayDate = DAY_DATES[d].start.substring(0, 10); // "2024-08-01"
    const start = timeStart ? `${dayDate}T${timeStart}:00-04:00` : DAY_DATES[d].start;
    const end = timeEnd ? `${dayDate}T${timeEnd}:00-04:00` : DAY_DATES[d].end;
    return `[${start},${end}]`;
  });

  return ranges.join(",");
}

export function decodeDays(str?: string): string[] {
  return parseCSV(str);
}

export function encodeDays(days: string[]): string {
  return days.join(",");
}
