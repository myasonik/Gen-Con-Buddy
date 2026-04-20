import { getActiveFilters } from "./getActiveFilters";
import type { SearchParams } from "../../utils/types";

test("returns empty array when no filters are set", () => {
  expect(getActiveFilters({})).toEqual([]);
});

test("ignores page, limit, and sort params", () => {
  expect(getActiveFilters({ page: 2, limit: 100, sort: "title.asc" })).toEqual(
    [],
  );
});

test("filter param produces 'Search:' label", () => {
  const result = getActiveFilters({ filter: "dragon" });
  expect(result).toEqual([{ key: "filter", label: "Search: dragon" }]);
});

test("eventType param uses EVENT_TYPES enum for label", () => {
  const result = getActiveFilters({ eventType: "RPG" });
  expect(result).toEqual([
    { key: "eventType", label: "Type: RPG - Role Playing Game" },
  ]);
});

test("eventType falls back to raw value when code is unknown", () => {
  const result = getActiveFilters({ eventType: "XYZ" });
  expect(result).toEqual([{ key: "eventType", label: "Type: XYZ" }]);
});

test("ageRequired uses AGE_GROUPS enum for label", () => {
  const result = getActiveFilters({ ageRequired: "21+" });
  expect(result).toEqual([{ key: "ageRequired", label: "Age: 21+" }]);
});

test("experienceRequired uses EXP enum for label", () => {
  const result = getActiveFilters({
    experienceRequired:
      "None (You've never played before - rules will be taught)",
  });
  expect(result).toEqual([{ key: "experienceRequired", label: "Exp: None" }]);
});

test("attendeeRegistration uses REGISTRATION enum for label", () => {
  const result = getActiveFilters({
    attendeeRegistration: "No, this event does not require tickets!",
  });
  expect(result).toEqual([
    {
      key: "attendeeRegistration",
      label: "Registration: Free (no ticket needed)",
    },
  ]);
});

test("specialCategory uses CATEGORY enum for label", () => {
  const result = getActiveFilters({ specialCategory: "Premier Event" });
  expect(result).toEqual([
    { key: "specialCategory", label: "Category: Premier Event" },
  ]);
});

test("days param expands keys to capitalized labels", () => {
  const result = getActiveFilters({ days: "fri,sat" });
  expect(result).toEqual([{ key: "days", label: "Days: Fri, Sat" }]);
});

test("days param with single day", () => {
  const result = getActiveFilters({ days: "wed" });
  expect(result).toEqual([{ key: "days", label: "Days: Wed" }]);
});

test("cost range formats with dollar signs", () => {
  const result = getActiveFilters({ cost: "[0,5]" });
  expect(result).toEqual([{ key: "cost", label: "Cost: $0–$5" }]);
});

test("cost range with only min", () => {
  const result = getActiveFilters({ cost: "[3,]" });
  expect(result).toEqual([{ key: "cost", label: "Cost: $3–" }]);
});

test("minPlayers range formats without dollar signs", () => {
  const result = getActiveFilters({ minPlayers: "[2,6]" });
  expect(result).toEqual([{ key: "minPlayers", label: "Min players: 2–6" }]);
});

test("duration range formats with hrs suffix", () => {
  const result = getActiveFilters({ duration: "[1,4]" });
  expect(result).toEqual([{ key: "duration", label: "Duration: 1–4 hrs" }]);
});

test("startDateTime date range formats dates", () => {
  const result = getActiveFilters({
    startDateTime: "[2024-08-02T00:00:00Z,2024-08-03T00:00:00Z]",
  });
  expect(result[0].key).toBe("startDateTime");
  expect(result[0].label).toMatch(/^Start:/);
});

test("plain string params show their value", () => {
  expect(getActiveFilters({ title: "dragon" })).toEqual([
    { key: "title", label: "Title: dragon" },
  ]);
  expect(getActiveFilters({ location: "Hall A" })).toEqual([
    { key: "location", label: "Location: Hall A" },
  ]);
  expect(getActiveFilters({ gmNames: "Bob" })).toEqual([
    { key: "gmNames", label: "GM: Bob" },
  ]);
});

test("multiple params produce one entry each", () => {
  const result = getActiveFilters({ filter: "dragon", days: "fri" });
  expect(result).toHaveLength(2);
  expect(result.map((r) => r.key)).toContain("filter");
  expect(result.map((r) => r.key)).toContain("days");
});
