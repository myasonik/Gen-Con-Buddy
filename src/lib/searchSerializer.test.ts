import { describe, expect, it } from "vitest";
import { parseSearch, stringifySearch } from "./searchSerializer";

describe("parseSearch", () => {
  it("handles string without leading ?", () => {
    expect(parseSearch("foo=bar")).toStrictEqual({ foo: "bar" });
  });

  it("strips leading ? before parsing", () => {
    expect(parseSearch("?foo=bar")).toStrictEqual({ foo: "bar" });
  });

  it("coerces 'true' to boolean true", () => {
    expect(parseSearch("flag=true")).toStrictEqual({ flag: true });
  });

  it("coerces 'false' to boolean false", () => {
    expect(parseSearch("flag=false")).toStrictEqual({ flag: false });
  });

  it("coerces numeric strings to numbers", () => {
    expect(parseSearch("page=2")).toStrictEqual({ page: 2 });
  });

  it("leaves non-numeric, non-boolean strings as strings", () => {
    expect(parseSearch("title=dragon")).toStrictEqual({ title: "dragon" });
  });

  it("collects multiple values for the same key into an array", () => {
    const result = parseSearch("tag=rpg&tag=bgm");
    expect(result).toStrictEqual({ tag: ["rpg", "bgm"] });
  });

  it("returns an empty object for an empty string", () => {
    expect(parseSearch("")).toStrictEqual({});
  });
});

describe("stringifySearch", () => {
  it("returns empty string when all values are empty/null/undefined", () => {
    expect(stringifySearch({ a: undefined, b: null })).toBe("");
  });

  it("serializes a plain string value", () => {
    expect(stringifySearch({ title: "dragon" })).toBe("?title=dragon");
  });

  it("serializes an array by appending each element", () => {
    const result = stringifySearch({ tag: ["rpg", "bgm"] });
    expect(result).toBe("?tag=rpg&tag=bgm");
  });

  it("skips null items inside an array", () => {
    const result = stringifySearch({ tag: ["rpg", null, "bgm"] });
    expect(result).toBe("?tag=rpg&tag=bgm");
  });

  it("round-trips: stringifySearch then parseSearch returns original values", () => {
    const original = { title: "dragon", page: 2 };
    const serialized = stringifySearch(original);
    const parsed = parseSearch(serialized);
    expect(parsed).toStrictEqual(original);
  });
});
