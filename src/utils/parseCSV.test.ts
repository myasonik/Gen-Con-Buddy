import { describe, expect, it } from "vitest";
import { parseCSV } from "./parseCSV";

describe("parseCSV", () => {
  it("undefined returns empty array", () => {
    expect(parseCSV(undefined)).toStrictEqual([]);
  });

  it("empty string returns empty array", () => {
    expect(parseCSV("")).toStrictEqual([]);
  });

  it("single value returns single-element array", () => {
    expect(parseCSV("RPG")).toStrictEqual(["RPG"]);
  });

  it("two values returns two-element array", () => {
    expect(parseCSV("RPG,BGM")).toStrictEqual(["RPG", "BGM"]);
  });

  it("trailing comma is ignored", () => {
    expect(parseCSV("RPG,")).toStrictEqual(["RPG"]);
  });

  it("leading comma is ignored", () => {
    expect(parseCSV(",RPG")).toStrictEqual(["RPG"]);
  });

  it("double comma is collapsed", () => {
    expect(parseCSV("RPG,,BGM")).toStrictEqual(["RPG", "BGM"]);
  });
});
