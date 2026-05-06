import { expect, test } from "vitest";
import { parseSortParam, serializeSortParam, type SortMap } from "./sortParam";

test("parseSortParam returns empty map for empty array", () => {
  expect(parseSortParam([])).toStrictEqual(new Map());
});

test("parseSortParam parses a single sort entry", () => {
  const result = parseSortParam(["2.created.gameId.asc"]);
  expect(result.get(2)?.get("created")).toStrictEqual({ field: "gameId", dir: "asc" });
});

test("parseSortParam parses desc direction", () => {
  const result = parseSortParam(["1.updated.title.desc"]);
  expect(result.get(1)?.get("updated")).toStrictEqual({ field: "title", dir: "desc" });
});

test("parseSortParam parses multiple entries", () => {
  const result = parseSortParam(["1.created.gameId.asc", "2.deleted.title.desc"]);
  expect(result.get(1)?.get("created")).toStrictEqual({ field: "gameId", dir: "asc" });
  expect(result.get(2)?.get("deleted")).toStrictEqual({ field: "title", dir: "desc" });
});

test("parseSortParam ignores entries with invalid position", () => {
  const result = parseSortParam(["notaNumber.created.gameId.asc"]);
  expect(result.size).toBe(0);
});

test("parseSortParam ignores entries with invalid direction", () => {
  const result = parseSortParam(["1.created.gameId.sideways"]);
  expect(result.size).toBe(0);
});

test("parseSortParam ignores entries with too few parts", () => {
  const result = parseSortParam(["1.created.gameId"]);
  expect(result.size).toBe(0);
});

test("parseSortParam ignores position 0", () => {
  const result = parseSortParam(["0.created.gameId.asc"]);
  expect(result.size).toBe(0);
});

test("serializeSortParam returns empty array for empty map", () => {
  expect(serializeSortParam(new Map())).toStrictEqual([]);
});

test("serializeSortParam serializes a single entry", () => {
  const map = new Map([[1, new Map([["created", { field: "gameId", dir: "asc" as const }]])]]);
  expect(serializeSortParam(map)).toStrictEqual(["1.created.gameId.asc"]);
});

test("serializeSortParam serializes multiple entries sorted by position", () => {
  const map: SortMap = new Map();
  map.set(2, new Map([["created", { field: "title", dir: "desc" as const }]]));
  map.set(1, new Map([["updated", { field: "gameId", dir: "asc" as const }]]));
  expect(serializeSortParam(map)).toStrictEqual(["1.updated.gameId.asc", "2.created.title.desc"]);
});

test("parseSortParam round-trips through serializeSortParam", () => {
  const original = ["1.created.gameId.asc", "3.deleted.title.desc"];
  expect(serializeSortParam(parseSortParam(original))).toStrictEqual(original);
});
