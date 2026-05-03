import { expect, test } from "vitest";
import { getActiveFilters } from "./getActiveFilters";
import { DiceTwentyFacesTwenty } from "../../ui/icons/DiceTwentyFacesTwenty";
import { RollingDices } from "../../ui/icons/RollingDices";
import { Calendar } from "../../ui/icons/Calendar";
import { Hourglass } from "../../ui/icons/Hourglass";
import { Trophy } from "../../ui/icons/Trophy";
import { Coins } from "../../ui/icons/Coins";
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass";

test("returns empty array when no filters are set", () => {
  expect(getActiveFilters({})).toStrictEqual([]);
});

test("ignores page, limit, and sort params", () => {
  expect(getActiveFilters({ page: 2, limit: 100, sort: "title.asc" })).toStrictEqual([]);
});

test("filter param produces 'Search:' label and remove clears filter", () => {
  const [chip] = getActiveFilters({ filter: "dragon" });
  expect(chip.id).toBe("filter");
  expect(chip.label).toBe("Search: dragon");
  expect(chip.remove({ filter: "dragon", title: "foo" })).toStrictEqual({
    title: "foo",
  });
});

test("eventType param produces one chip per code", () => {
  const result = getActiveFilters({ eventType: "RPG,BGM" });
  expect(result).toHaveLength(2);
  expect(result[0].id).toBe("eventType:RPG");
  expect(result[0].label).toBe("RPG - Role Playing Game");
  expect(result[1].id).toBe("eventType:BGM");
  expect(result[1].label).toBe("BGM - Board Game");
});

test("eventType chip remove leaves other codes intact", () => {
  const [rpg] = getActiveFilters({ eventType: "RPG,BGM" });
  expect(rpg.remove({ eventType: "RPG,BGM", title: "foo" })).toStrictEqual({
    eventType: "BGM",
    title: "foo",
  });
});

test("eventType chip remove clears param when it was the last code", () => {
  const [rpg] = getActiveFilters({ eventType: "RPG" });
  expect(rpg.id).toBe("eventType:RPG");
  expect(rpg.remove({ eventType: "RPG" })).toStrictEqual({});
});

test("eventType falls back to raw value when code is unknown", () => {
  const [chip] = getActiveFilters({ eventType: "XYZ" });
  expect(chip.id).toBe("eventType:XYZ");
  expect(chip.label).toBe("XYZ");
});

test("eventType chip skips empty segment from trailing comma", () => {
  const result = getActiveFilters({ eventType: "RPG," });
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe("eventType:RPG");
});

test("ageRequired uses AGE_GROUPS enum for label", () => {
  const [chip] = getActiveFilters({ ageRequired: "21+" });
  expect(chip.id).toBe("ageRequired");
  expect(chip.label).toBe("Age: 21+");
  expect(chip.remove({ ageRequired: "21+" })).toStrictEqual({});
});

test("experienceRequired uses EXP enum for label", () => {
  const [chip] = getActiveFilters({
    experienceRequired: "None (You've never played before - rules will be taught)",
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
  expect(fri.remove({ days: "fri,sat", title: "foo" })).toStrictEqual({
    days: "sat",
    title: "foo",
  });
});

test("days chip remove clears param when it was the last day", () => {
  const [wed] = getActiveFilters({ days: "wed" });
  expect(wed.id).toBe("days:wed");
  expect(wed.label).toBe("Wed");
  expect(wed.remove({ days: "wed" })).toStrictEqual({});
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
  expect(chip.remove({ cost: "[0,5]" })).toStrictEqual({});
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

test("timeStart and timeEnd produce a combined time range chip", () => {
  const [chip] = getActiveFilters({ timeStart: "09:00", timeEnd: "17:00" });
  expect(chip.id).toBe("timeRange");
  expect(chip.label).toBe("9 AM–5 PM");
});

test("only timeStart produces an 'After' chip", () => {
  const [chip] = getActiveFilters({ timeStart: "09:00" });
  expect(chip.id).toBe("timeRange");
  expect(chip.label).toBe("After 9 AM");
});

test("only timeEnd produces a 'Before' chip", () => {
  const [chip] = getActiveFilters({ timeEnd: "17:00" });
  expect(chip.id).toBe("timeRange");
  expect(chip.label).toBe("Before 5 PM");
});

test("time range chip remove clears both timeStart and timeEnd", () => {
  const [chip] = getActiveFilters({ timeStart: "09:00", timeEnd: "17:00", title: "foo" });
  expect(chip.remove({ timeStart: "09:00", timeEnd: "17:00", title: "foo" })).toStrictEqual({
    title: "foo",
  });
});

test("plain string params show their value", () => {
  expect(getActiveFilters({ title: "dragon" })[0].label).toBe("Title: dragon");
  expect(getActiveFilters({ location: "Hall A" })[0].label).toBe("Location: Hall A");
  expect(getActiveFilters({ gmNames: "Bob" })[0].label).toBe("GM: Bob");
});

test("multiple params: filter and days produce correct chips", () => {
  const result = getActiveFilters({ filter: "dragon", days: "fri" });
  expect(result).toHaveLength(2);
  const labels = result.map((r) => r.label);
  expect(labels).toContain("Search: dragon");
  expect(labels).toContain("Fri");
});

test("tournament uses YES_NO enum for label", () => {
  const [chip] = getActiveFilters({ tournament: "Yes" });
  expect(chip.id).toBe("tournament");
  expect(chip.label).toBe("Tournament: Yes");
  expect(chip.remove({ tournament: "Yes", title: "foo" })).toStrictEqual({ title: "foo" });
});

test("tournament: No value produces correct chip", () => {
  const [chip] = getActiveFilters({ tournament: "No" });
  expect(chip.label).toBe("Tournament: No");
});

test("materialsRequired uses YES_NO enum for label", () => {
  const [chip] = getActiveFilters({ materialsRequired: "Yes" });
  expect(chip.id).toBe("materialsRequired");
  expect(chip.label).toBe("Materials required: Yes");
  expect(chip.remove({ materialsRequired: "Yes" })).toStrictEqual({});
});

test("materialsRequired: No value produces correct chip", () => {
  const [chip] = getActiveFilters({ materialsRequired: "No" });
  expect(chip.label).toBe("Materials required: No");
});

// ── Icon assertions ────────────────────────────────────────────────────────

test("eventType:RPG chip has DiceTwentyFacesTwenty icon", () => {
  const [chip] = getActiveFilters({ eventType: "RPG" });
  expect(chip.icon).toBe(DiceTwentyFacesTwenty);
});

test("eventType:BGM chip has RollingDices icon", () => {
  const [chip] = getActiveFilters({ eventType: "BGM" });
  expect(chip.icon).toBe(RollingDices);
});

test("days chip has Calendar icon", () => {
  const [chip] = getActiveFilters({ days: "fri" });
  expect(chip.icon).toBe(Calendar);
});

test("timeRange chip has Hourglass icon", () => {
  const [chip] = getActiveFilters({ timeStart: "09:00" });
  expect(chip.icon).toBe(Hourglass);
});

test("duration chip has Hourglass icon", () => {
  const [chip] = getActiveFilters({ duration: "[1,4]" });
  expect(chip.icon).toBe(Hourglass);
});

test("tournament chip has Trophy icon", () => {
  const [chip] = getActiveFilters({ tournament: "Yes" });
  expect(chip.icon).toBe(Trophy);
});

test("cost chip has Coins icon", () => {
  const [chip] = getActiveFilters({ cost: "[0,5]" });
  expect(chip.icon).toBe(Coins);
});

test("filter (search) chip has MagnifyingGlass icon", () => {
  const [chip] = getActiveFilters({ filter: "dragon" });
  expect(chip.icon).toBe(MagnifyingGlass);
});

test("title chip has no icon", () => {
  const [chip] = getActiveFilters({ title: "dragon" });
  expect(chip.icon).toBeUndefined();
});

test("gmNames chip has no icon", () => {
  const [chip] = getActiveFilters({ gmNames: "Alice" });
  expect(chip.icon).toBeUndefined();
});
