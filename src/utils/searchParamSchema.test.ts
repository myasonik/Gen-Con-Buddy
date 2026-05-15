import { describe, it, expect } from "vitest";
import { coerceSearchParams, parseSearchParams, buildSearchParams } from "./searchParamSchema";

describe("coerceSearchParams", () => {
  it("coerces string params", () => {
    expect(coerceSearchParams({ title: "Dragons" }).title).toBe("Dragons");
  });

  it("coerces number params", () => {
    expect(coerceSearchParams({ limit: 25 }).limit).toBe(25);
  });

  it("drops string param given as number", () => {
    expect(coerceSearchParams({ title: 42 }).title).toBeUndefined();
  });

  it("drops number param given as string", () => {
    expect(coerceSearchParams({ limit: "25" }).limit).toBeUndefined();
  });

  it("ignores unknown keys", () => {
    const result = coerceSearchParams({ unknownKey: "value" });
    expect(Object.keys(result)).not.toContain("unknownKey");
  });
});

describe("parseSearchParams", () => {
  it("passes string fields through unchanged", () => {
    expect(parseSearchParams({ title: "Dragons" }).title).toBe("Dragons");
  });

  it("splits range field into Min/Max", () => {
    const result = parseSearchParams({ minPlayers: "[2,6]" });
    expect(result.minPlayersMin).toBe("2");
    expect(result.minPlayersMax).toBe("6");
  });

  it("returns undefined Min/Max when range param absent", () => {
    const result = parseSearchParams({});
    expect(result.minPlayersMin).toBeUndefined();
    expect(result.minPlayersMax).toBeUndefined();
  });

  it("splits dateRange field into Start/End", () => {
    const result = parseSearchParams({
      lastModified: "[2026-01-01T00:00:00Z,2026-08-01T00:00:00Z]",
    });
    expect(result.lastModifiedStart).toBe("2026-01-01T00:00");
    expect(result.lastModifiedEnd).toBe("2026-08-01T00:00");
  });

  it("excludes apiOnly params (sort is not in SearchFormValues)", () => {
    const result = parseSearchParams({ sort: "startDateTime.asc" });
    expect(Object.keys(result)).not.toContain("sort");
  });
});

describe("buildSearchParams", () => {
  it("includes non-empty string fields", () => {
    expect(buildSearchParams({ title: "Dragons" }).title).toBe("Dragons");
  });

  it("omits empty string fields", () => {
    expect(buildSearchParams({ title: "" })).not.toHaveProperty("title");
  });

  it("encodes range fields as [min,max]", () => {
    expect(buildSearchParams({ minPlayersMin: "2", minPlayersMax: "6" }).minPlayers).toBe("[2,6]");
  });

  it("encodes partial range with empty side", () => {
    expect(buildSearchParams({ minPlayersMin: "2" }).minPlayers).toBe("[2,]");
  });

  it("omits range when both sides absent", () => {
    expect(buildSearchParams({})).not.toHaveProperty("minPlayers");
  });

  it("encodes dateRange field with :00Z suffix", () => {
    expect(
      buildSearchParams({
        lastModifiedStart: "2026-01-01T00:00",
        lastModifiedEnd: "2026-08-01T00:00",
      }).lastModified,
    ).toBe("[2026-01-01T00:00:00Z,2026-08-01T00:00:00Z]");
  });
});
