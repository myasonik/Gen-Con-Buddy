import { expect, describe, it } from "vitest";
import {
  buildSearchParams,
  daysAndTimeToStartDateTime,
  GEN_CON_YEAR,
  parseSearchParams,
  decodeDays,
  encodeDays,
} from "./searchParams";

describe("GEN_CON_YEAR", () => {
  it("is 2026 — update this test intentionally when the API year changes", () => {
    // This test exists to make a year bump require a deliberate two-file edit:
    // the constant in searchParams.ts AND this assertion. Do not update it
    // automatically — confirm the API is actually serving the new year's data first.
    expect(GEN_CON_YEAR).toBe(2026);
  });
});

describe("buildSearchParams", () => {
  it("omits empty/undefined fields", () => {
    const result = buildSearchParams({ title: "" });
    expect(result).not.toHaveProperty("title");
  });

  it("includes non-empty text fields", () => {
    const result = buildSearchParams({ title: "Dungeons" });
    expect(result.title).toBe("Dungeons");
  });

  it('encodes a numeric range as "[min,max]"', () => {
    const result = buildSearchParams({
      minPlayersMin: "2",
      minPlayersMax: "6",
    });
    expect(result.minPlayers).toBe("[2,6]");
  });

  it("encodes a partial range with empty side", () => {
    const result = buildSearchParams({ minPlayersMin: "2", minPlayersMax: "" });
    expect(result.minPlayers).toBe("[2,]");
  });

  it("omits range when both sides are empty", () => {
    const result = buildSearchParams({ minPlayersMin: "", minPlayersMax: "" });
    expect(result).not.toHaveProperty("minPlayers");
  });

  it("passes materialsProvided text through unchanged", () => {
    const result = buildSearchParams({ materialsProvided: "Yes" });
    expect(result.materialsProvided).toBe("Yes");
  });

  it("omits empty materialsProvided", () => {
    const result = buildSearchParams({ materialsProvided: "" });
    expect(result).not.toHaveProperty("materialsProvided");
  });

  it("passes tournament text through unchanged", () => {
    const result = buildSearchParams({ tournament: "Grand Prix" });
    expect(result.tournament).toBe("Grand Prix");
  });

  it("omits empty tournament", () => {
    const result = buildSearchParams({ tournament: "" });
    expect(result).not.toHaveProperty("tournament");
  });

  it("sets days in URL params", () => {
    const result = buildSearchParams({ days: "thu" });
    expect(result.days).toBe("thu");
    expect(result).not.toHaveProperty("startDateTime");
  });

  it("sets multiple days in URL params", () => {
    const result = buildSearchParams({ days: "wed,sun" });
    expect(result.days).toBe("wed,sun");
    expect(result).not.toHaveProperty("startDateTime");
  });

  it("does not set days when empty", () => {
    const result = buildSearchParams({ days: "" });
    expect(result).not.toHaveProperty("days");
  });

  it("sets timeStart in URL params", () => {
    const result = buildSearchParams({ timeStart: "09:00" });
    expect(result.timeStart).toBe("09:00");
  });

  it("sets timeEnd in URL params", () => {
    const result = buildSearchParams({ timeEnd: "17:00" });
    expect(result.timeEnd).toBe("17:00");
  });

  it("omits empty timeStart", () => {
    const result = buildSearchParams({ timeStart: "" });
    expect(result).not.toHaveProperty("timeStart");
  });

  it("omits empty timeEnd", () => {
    const result = buildSearchParams({ timeEnd: "" });
    expect(result).not.toHaveProperty("timeEnd");
  });

  it("sets both days and time together", () => {
    const result = buildSearchParams({ days: "fri", timeStart: "09:00", timeEnd: "17:00" });
    expect(result.days).toBe("fri");
    expect(result.timeStart).toBe("09:00");
    expect(result.timeEnd).toBe("17:00");
  });
});

describe("parseSearchParams", () => {
  it("returns empty object from empty params", () => {
    const result = parseSearchParams({});
    expect(result.title).toBeUndefined();
    expect(result.minPlayersMin).toBeUndefined();
  });

  it("passes through text fields unchanged", () => {
    const result = parseSearchParams({ title: "Dungeons" });
    expect(result.title).toBe("Dungeons");
  });

  it('splits a numeric range "[2,6]" into min and max', () => {
    const result = parseSearchParams({ minPlayers: "[2,6]" });
    expect(result.minPlayersMin).toBe("2");
    expect(result.minPlayersMax).toBe("6");
  });

  it('handles a partial range "[2,]"', () => {
    const result = parseSearchParams({ minPlayers: "[2,]" });
    expect(result.minPlayersMin).toBe("2");
    expect(result.minPlayersMax).toBe("");
  });

  it("roundtrips: buildSearchParams then parseSearchParams returns original values", () => {
    const original = {
      title: "Test",
      minPlayersMin: "2",
      minPlayersMax: "6",
      materialsProvided: "Yes",
      tournament: "Grand Prix",
    };
    const params = buildSearchParams(original);
    const parsed = parseSearchParams(params);
    expect(parsed.title).toBe("Test");
    expect(parsed.minPlayersMin).toBe("2");
    expect(parsed.minPlayersMax).toBe("6");
    expect(parsed.materialsProvided).toBe("Yes");
    expect(parsed.tournament).toBe("Grand Prix");
  });

  it("parseSearchParams passes materialsProvided text through", () => {
    const result = parseSearchParams({ materialsProvided: "Yes" });
    expect(result.materialsProvided).toBe("Yes");
  });

  it("parseSearchParams passes tournament text through", () => {
    const result = parseSearchParams({ tournament: "Grand Prix" });
    expect(result.tournament).toBe("Grand Prix");
  });

  it("passes materialsRequired text through", () => {
    const result = buildSearchParams({ materialsRequired: "Yes" });
    expect(result.materialsRequired).toBe("Yes");
  });

  it("passes materialsRequiredDetails text through", () => {
    const result = buildSearchParams({
      materialsRequiredDetails: "Bring dice",
    });
    expect(result.materialsRequiredDetails).toBe("Bring dice");
  });

  it("parseSearchParams passes materialsRequired text through", () => {
    const result = parseSearchParams({ materialsRequired: "Yes" });
    expect(result.materialsRequired).toBe("Yes");
  });

  it("parseSearchParams passes materialsRequiredDetails text through", () => {
    const result = parseSearchParams({
      materialsRequiredDetails: "Bring dice",
    });
    expect(result.materialsRequiredDetails).toBe("Bring dice");
  });

  it("round-trips days directly from URL params", () => {
    const result = parseSearchParams({ days: "thu,sat" });
    expect(result.days).toBe("thu,sat");
  });

  it("returns undefined days when not in URL params", () => {
    const result = parseSearchParams({});
    expect(result.days).toBeUndefined();
  });

  it("round-trips days through buildSearchParams then parseSearchParams", () => {
    const params = buildSearchParams({ days: "fri,sat" });
    const parsed = parseSearchParams(params);
    expect(parsed.days).toBe("fri,sat");
  });

  it("round-trips timeStart through buildSearchParams then parseSearchParams", () => {
    const params = buildSearchParams({ timeStart: "09:00" });
    const parsed = parseSearchParams(params);
    expect(parsed.timeStart).toBe("09:00");
  });

  it("round-trips timeEnd through buildSearchParams then parseSearchParams", () => {
    const params = buildSearchParams({ timeEnd: "17:00" });
    const parsed = parseSearchParams(params);
    expect(parsed.timeEnd).toBe("17:00");
  });

  it("returns undefined timeStart when not in params", () => {
    const result = parseSearchParams({});
    expect(result.timeStart).toBeUndefined();
  });

  it("returns undefined timeEnd when not in params", () => {
    const result = parseSearchParams({});
    expect(result.timeEnd).toBeUndefined();
  });
});

describe("daysAndTimeToStartDateTime", () => {
  it("gen con wednesday falls in late July or early August and is a Wednesday", () => {
    const result = daysAndTimeToStartDateTime("wed");
    const [, dateStr] = result?.match(/\[([^,]+),/) ?? [];
    const date = new Date(dateStr);
    expect(date.getDay()).toBe(3); // Wednesday
    expect(date.getMonth()).toBeGreaterThanOrEqual(6); // July=6
    expect(date.getMonth()).toBeLessThanOrEqual(7); // August=7
  });

  it("converts a single day to a bracket range for the configured year", () => {
    const result = daysAndTimeToStartDateTime("thu");
    expect(result).toContain(String(GEN_CON_YEAR));
    expect(result).toMatch(/^\[.+,.+\]$/);
  });

  it("converts two non-contiguous days to comma-separated ranges", () => {
    const result = daysAndTimeToStartDateTime("wed,sun");
    expect(result).toContain(String(GEN_CON_YEAR));
    expect(result?.split("],[").length).toBe(2);
  });

  it("converts all five days to five ranges", () => {
    const result = daysAndTimeToStartDateTime("wed,thu,fri,sat,sun");
    expect(result).toContain(String(GEN_CON_YEAR));
    expect(result?.split("],[").length).toBe(5);
  });

  it("returns undefined for an empty string", () => {
    expect(daysAndTimeToStartDateTime("")).toBeUndefined();
  });

  it("applies time bounds when timeStart and timeEnd are provided", () => {
    const result = daysAndTimeToStartDateTime("thu", "09:00", "17:00");
    expect(result).toContain("T09:00:00-04:00");
    expect(result).toContain("T17:00:00-04:00");
  });

  it("generates one time-windowed range per day", () => {
    const result = daysAndTimeToStartDateTime("thu,fri", "09:00", "17:00");
    expect(result?.split("],[").length).toBe(2);
    expect(result).toContain("T09:00:00-04:00");
    expect(result).toContain("T17:00:00-04:00");
  });

  it("uses start-of-day when only timeEnd is provided", () => {
    const result = daysAndTimeToStartDateTime("thu", undefined, "12:00");
    expect(result).toContain("T00:00:00-04:00");
    expect(result).toContain("T12:00:00-04:00");
  });

  it("uses end-of-day when only timeStart is provided", () => {
    const result = daysAndTimeToStartDateTime("thu", "09:00", undefined);
    expect(result).toContain("T09:00:00-04:00");
    // end falls back to next day midnight (the pre-computed end)
    expect(result).toContain("T00:00:00-04:00");
  });

  it("each day in a multi-day selection gets its own date", () => {
    const result = daysAndTimeToStartDateTime("thu,fri", "10:00", "18:00");
    const ranges = result?.split("],[") ?? [];
    expect(ranges).toHaveLength(2);
    // Thu and Fri should have different date prefixes
    const [thursdayRange, fridayRange] = ranges;
    expect(thursdayRange).not.toStrictEqual(fridayRange);
  });
});

describe("decodeDays", () => {
  it("returns empty array for undefined", () => {
    expect(decodeDays(undefined)).toStrictEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(decodeDays("")).toStrictEqual([]);
  });

  it("returns single day array for one day", () => {
    expect(decodeDays("thu")).toStrictEqual(["thu"]);
  });

  it("returns multiple days for comma-separated string", () => {
    expect(decodeDays("wed,fri,sun")).toStrictEqual(["wed", "fri", "sun"]);
  });

  it("passes through unknown day names without dropping them", () => {
    expect(decodeDays("mon,tue")).toStrictEqual(["mon", "tue"]);
  });
});

describe("encodeDays", () => {
  it("returns empty string for empty array", () => {
    expect(encodeDays([])).toBe("");
  });

  it("returns single day for one-element array", () => {
    expect(encodeDays(["thu"])).toBe("thu");
  });

  it("joins multiple days with commas", () => {
    expect(encodeDays(["wed", "fri", "sun"])).toBe("wed,fri,sun");
  });

  it("roundtrips: encodeDays then decodeDays returns original array", () => {
    const days = ["thu", "fri", "sat"];
    expect(decodeDays(encodeDays(days))).toStrictEqual(days);
  });

  it("roundtrips: decodeDays then encodeDays returns original string", () => {
    const str = "wed,sun";
    expect(encodeDays(decodeDays(str))).toBe(str);
  });
});

describe("buildSearchParams — setRange with max-only", () => {
  it("encodes a range with only the max side", () => {
    const result = buildSearchParams({ minPlayersMax: "6" });
    expect(result.minPlayers).toBe("[,6]");
  });
});

describe("buildSearchParams — setDateRange", () => {
  it("encodes lastModified with both start and end", () => {
    const result = buildSearchParams({
      lastModifiedStart: "2026-01-01T00:00",
      lastModifiedEnd: "2026-08-01T00:00",
    });
    expect(result.lastModified).toBe("[2026-01-01T00:00:00Z,2026-08-01T00:00:00Z]");
  });

  it("encodes lastModified with only start", () => {
    const result = buildSearchParams({ lastModifiedStart: "2026-01-01T00:00" });
    expect(result.lastModified).toBe("[2026-01-01T00:00:00Z,]");
  });

  it("encodes lastModified with only end", () => {
    const result = buildSearchParams({ lastModifiedEnd: "2026-08-01T00:00" });
    expect(result.lastModified).toBe("[,2026-08-01T00:00:00Z]");
  });

  it("omits lastModified when both bounds are empty", () => {
    const result = buildSearchParams({ lastModifiedStart: "", lastModifiedEnd: "" });
    expect(result).not.toHaveProperty("lastModified");
  });
});

describe("parseSearchParams — range params", () => {
  it("parses all range params when all are present", () => {
    const result = parseSearchParams({
      maxPlayers: "[4,8]",
      duration: "[1,4]",
      roundNumber: "[1,3]",
      totalRounds: "[3,3]",
      minimumPlayTime: "[30,120]",
      cost: "[0,5]",
      ticketsAvailable: "[0,10]",
    });
    expect(result.maxPlayersMin).toBe("4");
    expect(result.maxPlayersMax).toBe("8");
    expect(result.durationMin).toBe("1");
    expect(result.durationMax).toBe("4");
    expect(result.roundNumberMin).toBe("1");
    expect(result.roundNumberMax).toBe("3");
    expect(result.totalRoundsMin).toBe("3");
    expect(result.totalRoundsMax).toBe("3");
    expect(result.minimumPlayTimeMin).toBe("30");
    expect(result.minimumPlayTimeMax).toBe("120");
    expect(result.costMin).toBe("0");
    expect(result.costMax).toBe("5");
    expect(result.ticketsAvailableMin).toBe("0");
    expect(result.ticketsAvailableMax).toBe("10");
  });

  it("returns undefined fields for absent range params", () => {
    const result = parseSearchParams({});
    expect(result.maxPlayersMin).toBeUndefined();
    expect(result.durationMin).toBeUndefined();
    expect(result.costMin).toBeUndefined();
  });

  it("returns undefined min/max when range format is invalid", () => {
    const result = parseSearchParams({ minPlayers: "not-a-range" });
    expect(result.minPlayersMin).toBeUndefined();
    expect(result.minPlayersMax).toBeUndefined();
  });
});

describe("parseSearchParams — lastModified (parseDateRange)", () => {
  it("parses lastModified with both bounds", () => {
    const result = parseSearchParams({
      lastModified: "[2026-01-01T00:00:00Z,2026-08-01T00:00:00Z]",
    });
    expect(result.lastModifiedStart).toBe("2026-01-01T00:00");
    expect(result.lastModifiedEnd).toBe("2026-08-01T00:00");
  });

  it("parses lastModified with empty start boundary", () => {
    const result = parseSearchParams({ lastModified: "[,2026-08-01T00:00:00Z]" });
    expect(result.lastModifiedStart).toBe("");
    expect(result.lastModifiedEnd).toBe("2026-08-01T00:00");
  });

  it("parses lastModified with empty end boundary", () => {
    const result = parseSearchParams({ lastModified: "[2026-01-01T00:00:00Z,]" });
    expect(result.lastModifiedStart).toBe("2026-01-01T00:00");
    expect(result.lastModifiedEnd).toBe("");
  });

  it("returns undefined lastModified fields when param is absent", () => {
    const result = parseSearchParams({});
    expect(result.lastModifiedStart).toBeUndefined();
    expect(result.lastModifiedEnd).toBeUndefined();
  });

  it("returns undefined lastModified fields when format is invalid", () => {
    const result = parseSearchParams({ lastModified: "not-a-range" });
    expect(result.lastModifiedStart).toBeUndefined();
    expect(result.lastModifiedEnd).toBeUndefined();
  });
});

describe("buildSearchParams — setRange max-is-undefined branch", () => {
  it("encodes range with undefined max (covers max ?? '' right-side)", () => {
    // minPlayersMax is not provided → values.minPlayersMax === undefined → max ?? "" uses fallback
    const result = buildSearchParams({ minPlayersMin: "2" });
    expect(result.minPlayers).toBe("[2,]");
  });
});
