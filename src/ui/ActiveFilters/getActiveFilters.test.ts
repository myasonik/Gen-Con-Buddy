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

test("filter param produces 'Search:' label and remove clears filter", () => {
  const [chip] = getActiveFilters({ filter: "dragon" });
  expect(chip.id).toBe("filter");
  expect(chip.label).toBe("Search: dragon");
  expect(chip.remove({ filter: "dragon", title: "foo" })).toEqual({
    title: "foo",
  });
});

test("eventType param uses EVENT_TYPES enum for label", () => {
  const [chip] = getActiveFilters({ eventType: "RPG" });
  expect(chip.label).toBe("Type: RPG - Role Playing Game");
  expect(chip.remove({ eventType: "RPG" })).toEqual({});
});

test("eventType falls back to raw value when code is unknown", () => {
  const [chip] = getActiveFilters({ eventType: "XYZ" });
  expect(chip.label).toBe("Type: XYZ");
});

test("ageRequired uses AGE_GROUPS enum for label", () => {
  const [chip] = getActiveFilters({ ageRequired: "21+" });
  expect(chip.id).toBe("ageRequired");
  expect(chip.label).toBe("Age: 21+");
  expect(chip.remove({ ageRequired: "21+" })).toEqual({});
});

test("experienceRequired uses EXP enum for label", () => {
  const [chip] = getActiveFilters({
    experienceRequired:
      "None (You've never played before - rules will be taught)",
  });
  expect(chip.label).toBe("Exp: None");
});

test("attendeeRegistration uses REGISTRATION enum for label", () => {
  const [chip] = getActiveFilters({
    attendeeRegistration: "No, this event does not require tickets!",
  });
  expect(chip.label).toBe("Registration: Free (no ticket needed)");
});

test("specialCategory uses CATEGORY enum for label", () => {
  const [chip] = getActiveFilters({ specialCategory: "Premier Event" });
  expect(chip.label).toBe("Category: Premier Event");
});

test("days param produces one chip per day", () => {
  const result = getActiveFilters({ days: "fri,sat" });
  expect(result).toHaveLength(2);
  expect(result[0].id).toBe("days:fri");
  expect(result[0].label).toBe("Fri");
  expect(result[1].id).toBe("days:sat");
  expect(result[1].label).toBe("Sat");
});

test("days chip remove leaves other days intact", () => {
  const [fri] = getActiveFilters({ days: "fri,sat" });
  expect(fri.remove({ days: "fri,sat", title: "foo" })).toEqual({
    days: "sat",
    title: "foo",
  });
});

test("days chip remove clears param when it was the last day", () => {
  const [wed] = getActiveFilters({ days: "wed" });
  expect(wed.id).toBe("days:wed");
  expect(wed.label).toBe("Wed");
  expect(wed.remove({ days: "wed" })).toEqual({});
});

test("days chip skips empty segment from trailing comma", () => {
  const result = getActiveFilters({ days: "fri," });
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe("days:fri");
});

test("cost range formats with dollar signs", () => {
  const [chip] = getActiveFilters({ cost: "[0,5]" });
  expect(chip.id).toBe("cost");
  expect(chip.label).toBe("Cost: $0–$5");
  expect(chip.remove({ cost: "[0,5]" })).toEqual({});
});

test("cost range with only min", () => {
  const [chip] = getActiveFilters({ cost: "[3,]" });
  expect(chip.label).toBe("Cost: $3–");
});

test("cost range with only max", () => {
  const [chip] = getActiveFilters({ cost: "[,5]" });
  expect(chip.label).toBe("Cost: –$5");
});

test("minPlayers range formats without dollar signs", () => {
  const [chip] = getActiveFilters({ minPlayers: "[2,6]" });
  expect(chip.label).toBe("Min players: 2–6");
});

test("duration range formats with hrs suffix", () => {
  const [chip] = getActiveFilters({ duration: "[1,4]" });
  expect(chip.label).toBe("Duration: 1–4 hrs");
});

test("duration range with only max", () => {
  const [chip] = getActiveFilters({ duration: "[,4]" });
  expect(chip.label).toBe("Duration: –4 hrs");
});

test("startDateTime date range formats dates", () => {
  const [chip] = getActiveFilters({
    startDateTime: "[2024-08-02T00:00:00Z,2024-08-03T00:00:00Z]",
  });
  expect(chip.label).toMatch(/^Start:/);
});

test("plain string params show their value", () => {
  expect(getActiveFilters({ title: "dragon" })[0].label).toBe("Title: dragon");
  expect(getActiveFilters({ location: "Hall A" })[0].label).toBe(
    "Location: Hall A",
  );
  expect(getActiveFilters({ gmNames: "Bob" })[0].label).toBe("GM: Bob");
});

test("multiple params: filter and days produce correct chips", () => {
  const result = getActiveFilters({ filter: "dragon", days: "fri" });
  expect(result).toHaveLength(2);
  const labels = result.map((r) => r.label);
  expect(labels).toContain("Search: dragon");
  expect(labels).toContain("Fri");
});
