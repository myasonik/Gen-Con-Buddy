import { expect, test } from "vitest";
import { SCHEMA } from "./searchParamSchema";
import { FILTER_FIELDS } from "./filterFields";

const filterableKeys = (Object.entries(SCHEMA) as [string, string][])
  .filter(([, type]) => type !== "apiOnly" && type !== "number")
  .map(([key]) => key);

test("FILTER_FIELDS covers every filterable schema key", () => {
  const missing = filterableKeys.filter((key) => !(key in FILTER_FIELDS));
  expect(missing).toStrictEqual([]);
});

test("FILTER_FIELDS contains no keys that are not in the filterable schema", () => {
  const extra = Object.keys(FILTER_FIELDS).filter((key) => !filterableKeys.includes(key));
  expect(extra).toStrictEqual([]);
});
