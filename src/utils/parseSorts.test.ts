import { describe, expect, it } from "vitest";
import { parseSorts, serializeSorts } from "./parseSorts";

describe("parseSorts", () => {
  it("parses a single asc entry", () => {
    expect(parseSorts("startDateTime.asc")).toStrictEqual([{ field: "startDateTime", dir: "asc" }]);
  });

  it("parses multiple entries", () => {
    expect(parseSorts("startDateTime.asc,title.desc")).toStrictEqual([
      { field: "startDateTime", dir: "asc" },
      { field: "title", dir: "desc" },
    ]);
  });

  it("returns [] for empty string", () => {
    expect(parseSorts("")).toStrictEqual([]);
  });

  it("skips tokens with invalid direction", () => {
    expect(parseSorts("startDateTime.sideways")).toStrictEqual([]);
  });

  it("skips tokens missing direction", () => {
    expect(parseSorts("startDateTime")).toStrictEqual([]);
  });

  it("preserves order", () => {
    const result = parseSorts("cost.desc,title.asc,startDateTime.asc");
    expect(result.map((s) => s.field)).toStrictEqual(["cost", "title", "startDateTime"]);
  });
});

describe("serializeSorts", () => {
  it("serializes a single entry", () => {
    expect(serializeSorts([{ field: "startDateTime", dir: "asc" }])).toBe("startDateTime.asc");
  });

  it("serializes multiple entries", () => {
    expect(
      serializeSorts([
        { field: "startDateTime", dir: "asc" },
        { field: "title", dir: "desc" },
      ]),
    ).toBe("startDateTime.asc,title.desc");
  });

  it("returns undefined for empty array", () => {
    expect(serializeSorts([])).toBeUndefined();
  });
});

describe("round-trip", () => {
  it("parse then serialize returns the original string", () => {
    const s = "startDateTime.asc,title.desc,cost.asc";
    expect(serializeSorts(parseSorts(s))).toBe(s);
  });
});
