import { expect, test } from "vitest";
import { sortEvents } from "./sortEvents";
import { makeEvent } from "../test/msw/factory";

test("returns empty array for empty input", () => {
  expect(sortEvents([], "title", "asc")).toStrictEqual([]);
});

test("sorts string field ascending", () => {
  const events = [makeEvent({ title: "Zebra" }), makeEvent({ title: "Apple" })];
  const sorted = sortEvents(events, "title", "asc");
  expect(sorted[0].attributes.title).toBe("Apple");
  expect(sorted[1].attributes.title).toBe("Zebra");
});

test("sorts string field descending", () => {
  const events = [makeEvent({ title: "Apple" }), makeEvent({ title: "Zebra" })];
  const sorted = sortEvents(events, "title", "desc");
  expect(sorted[0].attributes.title).toBe("Zebra");
  expect(sorted[1].attributes.title).toBe("Apple");
});

test("sorts numeric field ascending", () => {
  const events = [makeEvent({ cost: 10 }), makeEvent({ cost: 2 }), makeEvent({ cost: 5 })];
  const sorted = sortEvents(events, "cost", "asc");
  expect(sorted.map((e) => e.attributes.cost)).toStrictEqual([2, 5, 10]);
});

test("sorts numeric field descending", () => {
  const events = [makeEvent({ cost: 5 }), makeEvent({ cost: 10 }), makeEvent({ cost: 2 })];
  const sorted = sortEvents(events, "cost", "desc");
  expect(sorted.map((e) => e.attributes.cost)).toStrictEqual([10, 5, 2]);
});

test("does not mutate the original array", () => {
  const events = [makeEvent({ title: "Zebra" }), makeEvent({ title: "Apple" })];
  const original = [...events];
  sortEvents(events, "title", "asc");
  expect(events[0].attributes.title).toBe(original[0].attributes.title);
});

test("unknown field falls back to stable order", () => {
  const events = [makeEvent({ title: "B" }), makeEvent({ title: "A" })];
  const sorted = sortEvents(events, "nonexistentField", "asc");
  expect(sorted).toHaveLength(2);
});
