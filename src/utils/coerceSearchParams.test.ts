import { expect, describe, it } from "vitest";
import { coerceSearchParams } from "./searchParamSchema";

describe("coerceSearchParams", () => {
  it("returns all-undefined SearchParams from empty object", () => {
    const result = coerceSearchParams({});
    expect(result.title).toBeUndefined();
    expect(result.limit).toBeUndefined();
    expect(result.page).toBeUndefined();
    expect(result.sort).toBeUndefined();
  });

  it("passes through string params when correct type", () => {
    const result = coerceSearchParams({ title: "Dragon Hunt", filter: "dragon" });
    expect(result.title).toBe("Dragon Hunt");
    expect(result.filter).toBe("dragon");
  });

  it("passes through number params (limit, page) when correct type", () => {
    const result = coerceSearchParams({ limit: 25, page: 2 });
    expect(result.limit).toBe(25);
    expect(result.page).toBe(2);
  });

  it("drops limit to undefined when given a string instead of number", () => {
    const result = coerceSearchParams({ limit: "25" });
    expect(result.limit).toBeUndefined();
  });

  it("drops page to undefined when given a string instead of number", () => {
    const result = coerceSearchParams({ page: "2" });
    expect(result.page).toBeUndefined();
  });

  it("drops string param to undefined when given a number", () => {
    const result = coerceSearchParams({ title: 42 });
    expect(result.title).toBeUndefined();
  });

  it("ignores completely unknown keys", () => {
    const result = coerceSearchParams({ unknownKey: "value", anotherUnknown: 123 });
    expect(Object.keys(result)).not.toContain("unknownKey");
    expect(Object.keys(result)).not.toContain("anotherUnknown");
  });

  it("handles all string params in isolation: eventType", () => {
    expect(coerceSearchParams({ eventType: "RPG" }).eventType).toBe("RPG");
  });

  it("handles all string params in isolation: gameId", () => {
    expect(coerceSearchParams({ gameId: "RPG24000001" }).gameId).toBe("RPG24000001");
  });

  it("handles all string params in isolation: group", () => {
    expect(coerceSearchParams({ group: "Test Group" }).group).toBe("Test Group");
  });

  it("handles all string params in isolation: shortDescription", () => {
    expect(coerceSearchParams({ shortDescription: "Short" }).shortDescription).toBe("Short");
  });

  it("handles all string params in isolation: longDescription", () => {
    expect(coerceSearchParams({ longDescription: "Long" }).longDescription).toBe("Long");
  });

  it("handles all string params in isolation: gameSystem", () => {
    expect(coerceSearchParams({ gameSystem: "D&D" }).gameSystem).toBe("D&D");
  });

  it("handles all string params in isolation: rulesEdition", () => {
    expect(coerceSearchParams({ rulesEdition: "5e" }).rulesEdition).toBe("5e");
  });

  it("handles all string params in isolation: days", () => {
    expect(coerceSearchParams({ days: "thu,fri" }).days).toBe("thu,fri");
  });

  it("handles all string params in isolation: timeStart", () => {
    expect(coerceSearchParams({ timeStart: "09:00" }).timeStart).toBe("09:00");
  });

  it("handles all string params in isolation: timeEnd", () => {
    expect(coerceSearchParams({ timeEnd: "17:00" }).timeEnd).toBe("17:00");
  });

  it("handles all string params in isolation: sort", () => {
    expect(coerceSearchParams({ sort: "startDateTime.asc" }).sort).toBe("startDateTime.asc");
  });

  it("handles all string params in isolation: location", () => {
    expect(coerceSearchParams({ location: "Hall A" }).location).toBe("Hall A");
  });

  it("handles all string params in isolation: materialsRequired", () => {
    expect(coerceSearchParams({ materialsRequired: "Yes" }).materialsRequired).toBe("Yes");
  });

  it("handles all string params in isolation: materialsRequiredDetails", () => {
    expect(
      coerceSearchParams({ materialsRequiredDetails: "Bring dice" }).materialsRequiredDetails,
    ).toBe("Bring dice");
  });

  it("passes all params correctly when all present with correct types", () => {
    const raw = {
      limit: 10,
      page: 1,
      filter: "dragon",
      gameId: "RPG24000001",
      title: "Dragon Hunt",
      eventType: "RPG",
      group: "Test",
      shortDescription: "Short",
      longDescription: "Long",
      gameSystem: "D&D",
      rulesEdition: "5e",
      minPlayers: "[2,6]",
      maxPlayers: "[2,6]",
      ageRequired: "everyone",
      experienceRequired: "none",
      materialsProvided: "Yes",
      materialsRequired: "No",
      materialsRequiredDetails: "",
      startDateTime: "2024-08-01T10:00:00Z",
      duration: "[2,4]",
      endDateTime: "2024-08-01T14:00:00Z",
      gmNames: "Jane",
      website: "http://example.com",
      email: "test@test.com",
      tournament: "No",
      roundNumber: "[1,1]",
      totalRounds: "[1,1]",
      minimumPlayTime: "[2,4]",
      attendeeRegistration: "open",
      cost: "[0,10]",
      location: "ICC",
      roomName: "Hall A",
      tableNumber: "1",
      specialCategory: "none",
      ticketsAvailable: "[0,10]",
      lastModified: "2024-01-01T00:00:00Z",
      days: "thu,fri",
      timeStart: "09:00",
      timeEnd: "17:00",
      sort: "startDateTime.asc",
    };
    const result = coerceSearchParams(raw);
    expect(result.limit).toBe(10);
    expect(result.page).toBe(1);
    expect(result.filter).toBe("dragon");
    expect(result.title).toBe("Dragon Hunt");
    expect(result.days).toBe("thu,fri");
    expect(result.sort).toBe("startDateTime.asc");
  });
});
