import { describe, expect, expectTypeOf, it } from "vitest";
import {
  WILDHAVENS_GAME_IDS,
  STAFF_PICK_IDS,
  STAFF_PICK_GROUP,
  STAFF_PICK_HEADING,
  STAFF_PICK_SUBTEXT,
} from "./staffPicks";

describe("WILDHAVENS_GAME_IDS", () => {
  it("contains exactly 7 IDs", () => {
    expect(WILDHAVENS_GAME_IDS).toHaveLength(7);
  });

  it("contains no duplicates", () => {
    expect(new Set(WILDHAVENS_GAME_IDS).size).toBe(WILDHAVENS_GAME_IDS.length);
  });

  it("contains all expected game IDs", () => {
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310303");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310286");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310299");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310301");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310296");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310298");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310302");
  });
});

describe("STAFF_PICK_IDS", () => {
  it("is a Set derived from WILDHAVENS_GAME_IDS", () => {
    for (const id of WILDHAVENS_GAME_IDS) {
      expect(STAFF_PICK_IDS.has(id)).toBe(true);
    }
  });

  it("does not contain IDs outside WILDHAVENS_GAME_IDS", () => {
    expect(STAFF_PICK_IDS.has("RPG24000001")).toBe(false);
    expect(STAFF_PICK_IDS.has("")).toBe(false);
  });

  it("has the same size as WILDHAVENS_GAME_IDS", () => {
    expect(STAFF_PICK_IDS.size).toBe(WILDHAVENS_GAME_IDS.length);
  });
});

describe("display string constants", () => {
  it("STAFF_PICK_GROUP is a non-empty string", () => {
    expectTypeOf(STAFF_PICK_GROUP).toBeString();
    expect(STAFF_PICK_GROUP.length).toBeGreaterThan(0);
  });

  it("STAFF_PICK_HEADING is a non-empty string", () => {
    expectTypeOf(STAFF_PICK_HEADING).toBeString();
    expect(STAFF_PICK_HEADING.length).toBeGreaterThan(0);
  });

  it("STAFF_PICK_SUBTEXT is a non-empty string", () => {
    expectTypeOf(STAFF_PICK_SUBTEXT).toBeString();
    expect(STAFF_PICK_SUBTEXT.length).toBeGreaterThan(0);
  });
});
