import { describe, expect, it } from "vitest";
import { addSort, removeSort, setSortDir, reorderSort } from "./sortManipulation";
import type { SortState } from "./types";

const s1: SortState = { field: "title", dir: "asc" };
const s2: SortState = { field: "cost", dir: "desc" };
const s3: SortState = { field: "startDateTime", dir: "asc" };

describe("addSort", () => {
  it("appends a new field with asc direction by default", () => {
    expect(addSort([], "title")).toStrictEqual([{ field: "title", dir: "asc" }]);
  });

  it("appends with specified direction", () => {
    expect(addSort([], "title", "desc")).toStrictEqual([{ field: "title", dir: "desc" }]);
  });

  it("does not add a field already present", () => {
    expect(addSort([s1], "title")).toStrictEqual([s1]);
  });

  it("does not mutate the original array", () => {
    const original = [s1];
    addSort(original, "cost");
    expect(original).toHaveLength(1);
  });
});

describe("removeSort", () => {
  it("removes the matching field", () => {
    expect(removeSort([s1, s2], "title")).toStrictEqual([s2]);
  });

  it("returns the same array when field is not present", () => {
    expect(removeSort([s1], "cost")).toStrictEqual([s1]);
  });

  it("does not mutate the original array", () => {
    const original = [s1, s2];
    removeSort(original, "title");
    expect(original).toHaveLength(2);
  });
});

describe("setSortDir", () => {
  it("updates direction for the matching field", () => {
    expect(setSortDir([s1], "title", "desc")).toStrictEqual([{ field: "title", dir: "desc" }]);
  });

  it("leaves other fields unchanged", () => {
    expect(setSortDir([s1, s2], "title", "desc")).toStrictEqual([
      { field: "title", dir: "desc" },
      s2,
    ]);
  });

  it("does not mutate the original array", () => {
    const original = [s1];
    setSortDir(original, "title", "desc");
    expect(original[0].dir).toBe("asc");
  });
});

describe("reorderSort", () => {
  it("moves an entry forward", () => {
    expect(reorderSort([s1, s2, s3], 0, 2)).toStrictEqual([s2, s3, s1]);
  });

  it("moves an entry backward", () => {
    expect(reorderSort([s1, s2, s3], 2, 0)).toStrictEqual([s3, s1, s2]);
  });

  it("no-op when fromIndex equals toIndex", () => {
    expect(reorderSort([s1, s2], 1, 1)).toStrictEqual([s1, s2]);
  });

  it("does not mutate the original array", () => {
    const original = [s1, s2];
    reorderSort(original, 0, 1);
    expect(original[0]).toBe(s1);
  });
});
