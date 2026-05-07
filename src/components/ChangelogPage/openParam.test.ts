import { describe, expect, it } from "vitest";
import { parseOpenParam, serializeOpenParam, type OpenMap } from "./openParam";

describe("parseOpenParam", () => {
  it("empty array returns empty map", () => {
    expect(parseOpenParam([])).toStrictEqual(new Map());
  });

  it("2-segment value parses as open with no sort", () => {
    const result = parseOpenParam(["1.created"]);
    const expected: OpenMap = new Map([[1, new Map([["created", undefined]])]]);
    expect(result).toStrictEqual(expected);
  });

  it("4-segment value parses as open with sort", () => {
    const result = parseOpenParam(["2.updated.title.asc"]);
    const expected: OpenMap = new Map([
      [2, new Map([["updated", { field: "title", dir: "asc" as const }]])],
    ]);
    expect(result).toStrictEqual(expected);
  });

  it("parses desc direction", () => {
    const result = parseOpenParam(["1.deleted.startDateTime.desc"]);
    expect(result.get(1)?.get("deleted")).toStrictEqual({ field: "startDateTime", dir: "desc" });
  });

  it("multiple values for same position merge into one inner map", () => {
    const result = parseOpenParam(["1.created", "1.updated.title.asc"]);
    const pos1 = result.get(1);
    expect(pos1?.get("created")).toBeUndefined();
    expect(pos1?.has("created")).toBe(true);
    expect(pos1?.get("updated")).toStrictEqual({ field: "title", dir: "asc" });
  });

  it("values for different positions produce separate entries", () => {
    const result = parseOpenParam(["1.created", "3.updated"]);
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(2)).toBe(false);
  });

  it("1-segment value parses as row open with no sub-groups", () => {
    const result = parseOpenParam(["1"]);
    const expected: OpenMap = new Map([[1, new Map()]]);
    expect(result).toStrictEqual(expected);
  });

  it("drops 3-segment values", () => {
    expect(parseOpenParam(["1.created.title"])).toStrictEqual(new Map());
  });

  it("drops 5-segment values", () => {
    expect(parseOpenParam(["1.created.title.asc.extra"])).toStrictEqual(new Map());
  });

  it("drops 4-segment with bad dir", () => {
    expect(parseOpenParam(["1.created.title.sideways"])).toStrictEqual(new Map());
  });

  it("drops 4-segment with empty field", () => {
    expect(parseOpenParam(["1.created..asc"])).toStrictEqual(new Map());
  });

  it("drops 4-segment with non-positive position", () => {
    expect(parseOpenParam(["0.created.title.asc"])).toStrictEqual(new Map());
  });

  it("drops 2-segment with non-numeric position", () => {
    expect(parseOpenParam(["x.created"])).toStrictEqual(new Map());
  });
});

describe("serializeOpenParam", () => {
  it("empty map returns empty array", () => {
    expect(serializeOpenParam(new Map())).toStrictEqual([]);
  });

  it("row with no sub-groups serializes as 1 segment", () => {
    const map: OpenMap = new Map([[1, new Map()]]);
    expect(serializeOpenParam(map)).toStrictEqual(["1"]);
  });

  it("open with no sort serializes as 2 segments", () => {
    const map: OpenMap = new Map([[1, new Map([["created", undefined]])]]);
    expect(serializeOpenParam(map)).toStrictEqual(["1.created"]);
  });

  it("open with sort serializes as 4 segments", () => {
    const map: OpenMap = new Map([
      [2, new Map([["updated", { field: "title", dir: "asc" as const }]])],
    ]);
    expect(serializeOpenParam(map)).toStrictEqual(["2.updated.title.asc"]);
  });

  it("multiple groups at same position produce one value per group", () => {
    const map: OpenMap = new Map([
      [
        1,
        new Map<string, { field: string; dir: "asc" | "desc" } | undefined>([
          ["created", undefined],
          ["updated", { field: "title", dir: "asc" }],
        ]),
      ],
    ]);
    expect(serializeOpenParam(map)).toStrictEqual(["1.created", "1.updated.title.asc"]);
  });

  it("groups within a position are sorted alphabetically", () => {
    const map: OpenMap = new Map([
      [
        1,
        new Map<string, { field: string; dir: "asc" | "desc" } | undefined>([
          ["updated", undefined],
          ["created", undefined],
        ]),
      ],
    ]);
    expect(serializeOpenParam(map)).toStrictEqual(["1.created", "1.updated"]);
  });

  it("positions are sorted numerically", () => {
    const map: OpenMap = new Map([
      [3, new Map([["created", undefined]])],
      [1, new Map([["updated", undefined]])],
    ]);
    expect(serializeOpenParam(map)).toStrictEqual(["1.updated", "3.created"]);
  });
});

describe("round-trip", () => {
  it("parse then serialize returns original values (sorted)", () => {
    const values = ["1.created", "1.updated.title.asc", "3.deleted.startDateTime.desc"];
    expect(serializeOpenParam(parseOpenParam(values))).toStrictEqual(values);
  });
});
