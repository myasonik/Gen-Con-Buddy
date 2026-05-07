import { test, expect } from "vitest";
import { parseSortString } from "./parseSortString";

test("parses a valid asc sort string", () => {
  expect(parseSortString("startDateTime.asc")).toStrictEqual({
    field: "startDateTime",
    dir: "asc",
  });
});

test("parses a valid desc sort string", () => {
  expect(parseSortString("title.desc")).toStrictEqual({ field: "title", dir: "desc" });
});

test("returns null for a string with no dot", () => {
  expect(parseSortString("startDateTime")).toBeNull();
});

test("returns null for an invalid dir", () => {
  expect(parseSortString("startDateTime.sideways")).toBeNull();
});

test("returns null for an empty string", () => {
  expect(parseSortString("")).toBeNull();
});

test("ignores extra dot-separated segments", () => {
  expect(parseSortString("startDateTime.asc.extra")).toStrictEqual({
    field: "startDateTime",
    dir: "asc",
  });
});
