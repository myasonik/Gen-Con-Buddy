import { describe, expect, it } from "vitest";
import { filterChangelogEvents } from "./filterChangelogEvents";
import type { Event } from "./types";

function makeEvent(overrides: Partial<Event["attributes"]> = {}): Event {
  return {
    id: "1",
    type: "events",
    attributes: {
      gameId: "RPG2600001",
      year: 2026,
      group: "Test",
      title: "Test Event",
      shortDescription: "",
      longDescription: "",
      eventType: "RPG",
      gameSystem: "D&D",
      rulesEdition: "5e",
      minPlayers: 2,
      maxPlayers: 6,
      ageRequired: "everyone",
      experienceRequired: "none",
      materialsProvided: "Yes",
      materialsRequired: "No",
      materialsRequiredDetails: "",
      // Thursday July 30 2026 at 10:00 ET
      startDateTime: "2026-07-30T10:00:00-04:00",
      duration: 4,
      endDateTime: "2026-07-30T14:00:00-04:00",
      gmNames: "Jane",
      website: "",
      email: "",
      tournament: "No",
      roundNumber: 1,
      totalRounds: 1,
      minimumPlayTime: 4,
      attendeeRegistration: "open",
      cost: 0,
      location: "ICC",
      roomName: "Hall A",
      tableNumber: "1",
      specialCategory: "none",
      ticketsAvailable: 3,
      lastModified: "2026-01-01T00:00:00Z",
      alsoRuns: "",
      prize: "",
      rulesComplexity: "Medium",
      originalOrder: 1,
      ...overrides,
    },
  };
}

// Gen Con 2026: Wed July 29 – Sun Aug 2
const THU_EVENT = makeEvent({ startDateTime: "2026-07-30T10:00:00-04:00" }); // Thu 10am ET
const SAT_EVENT = makeEvent({ startDateTime: "2026-08-01T14:00:00-04:00" }); // Sat 2pm ET
const RPG_EVENT = makeEvent({ eventType: "RPG" });
const BGM_EVENT = makeEvent({ eventType: "BGM" });

describe("filterChangelogEvents", () => {
  it("returns all events when filter is empty", () => {
    expect(filterChangelogEvents([RPG_EVENT, BGM_EVENT], {})).toHaveLength(2);
  });

  it("filters by single eventType", () => {
    const result = filterChangelogEvents([RPG_EVENT, BGM_EVENT], { eventType: "RPG" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.eventType).toBe("RPG");
  });

  it("filters by multiple eventTypes (comma-separated)", () => {
    const zkill = makeEvent({ eventType: "ZED" });
    const result = filterChangelogEvents([RPG_EVENT, BGM_EVENT, zkill], { eventType: "RPG,BGM" });
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no events match eventType", () => {
    expect(filterChangelogEvents([RPG_EVENT], { eventType: "BGM" })).toHaveLength(0);
  });

  it("filters by single day", () => {
    const result = filterChangelogEvents([THU_EVENT, SAT_EVENT], { days: "thu" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  it("filters by multiple days", () => {
    const result = filterChangelogEvents([THU_EVENT, SAT_EVENT], { days: "thu,sat" });
    expect(result).toHaveLength(2);
  });

  it("returns empty array when event falls outside selected days", () => {
    expect(filterChangelogEvents([SAT_EVENT], { days: "thu" })).toHaveLength(0);
  });

  it("filters by timeStart (inclusive)", () => {
    const early = makeEvent({ startDateTime: "2026-07-30T08:00:00-04:00" }); // 8am
    const later = makeEvent({ startDateTime: "2026-07-30T10:00:00-04:00" }); // 10am
    const result = filterChangelogEvents([early, later], { timeStart: "09:00" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  it("filters by timeEnd (inclusive)", () => {
    const early = makeEvent({ startDateTime: "2026-07-30T08:00:00-04:00" }); // 8am
    const later = makeEvent({ startDateTime: "2026-07-30T14:00:00-04:00" }); // 2pm
    const result = filterChangelogEvents([early, later], { timeEnd: "12:00" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T08:00:00-04:00");
  });

  it("filters by timeStart and timeEnd together", () => {
    const early = makeEvent({ startDateTime: "2026-07-30T07:00:00-04:00" }); // 7am
    const mid = makeEvent({ startDateTime: "2026-07-30T10:00:00-04:00" }); // 10am
    const late = makeEvent({ startDateTime: "2026-07-30T18:00:00-04:00" }); // 6pm
    const result = filterChangelogEvents([early, mid, late], {
      timeStart: "09:00",
      timeEnd: "12:00",
    });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  it("combines eventType and days filters", () => {
    const rpgThu = makeEvent({ eventType: "RPG", startDateTime: "2026-07-30T10:00:00-04:00" });
    const bgmThu = makeEvent({ eventType: "BGM", startDateTime: "2026-07-30T10:00:00-04:00" });
    const rpgSat = makeEvent({ eventType: "RPG", startDateTime: "2026-08-01T10:00:00-04:00" });
    const result = filterChangelogEvents([rpgThu, bgmThu, rpgSat], {
      eventType: "RPG",
      days: "thu",
    });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  it("returns empty array when no events exist", () => {
    expect(filterChangelogEvents([], { eventType: "RPG" })).toHaveLength(0);
  });
});
