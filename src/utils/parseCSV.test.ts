import { describe, expect, test } from "vitest";
import { parseCSV } from "./parseCSV";

describe("parseCSV", () => {
  test("undefined returns empty array", () => {
    expect(parseCSV(undefined)).toEqual([]);
  });

  test("empty string returns empty array", () => {
    expect(parseCSV("")).toEqual([]);
  });

  test("single value returns single-element array", () => {
    expect(parseCSV("RPG")).toEqual(["RPG"]);
  });

  test("two values returns two-element array", () => {
    expect(parseCSV("RPG,BGM")).toEqual(["RPG", "BGM"]);
  });

  test("trailing comma is ignored", () => {
    expect(parseCSV("RPG,")).toEqual(["RPG"]);
  });

  test("leading comma is ignored", () => {
    expect(parseCSV(",RPG")).toEqual(["RPG"]);
  });

  test("double comma is collapsed", () => {
    expect(parseCSV("RPG,,BGM")).toEqual(["RPG", "BGM"]);
  });
});
