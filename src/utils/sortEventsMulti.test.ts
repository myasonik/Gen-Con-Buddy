import { describe, expect, it } from "vitest";
import { sortEventsMulti } from "./sortEventsMulti";
import { makeEvent } from "../test/msw/factory";

describe("sortEventsMulti", () => {
  it("returns the same array when sorts is empty", () => {
    const events = [makeEvent({ title: "B" }), makeEvent({ title: "A" })];
    expect(sortEventsMulti(events, [])).toStrictEqual(events);
  });

  it("sorts by a single string field ascending", () => {
    const events = [
      makeEvent({ title: "B" }),
      makeEvent({ title: "A" }),
      makeEvent({ title: "C" }),
    ];
    const sorted = sortEventsMulti(events, [{ field: "title", dir: "asc" }]);
    expect(sorted.map((e) => e.attributes.title)).toStrictEqual(["A", "B", "C"]);
  });

  it("sorts by a single string field descending", () => {
    const events = [
      makeEvent({ title: "B" }),
      makeEvent({ title: "A" }),
      makeEvent({ title: "C" }),
    ];
    const sorted = sortEventsMulti(events, [{ field: "title", dir: "desc" }]);
    expect(sorted.map((e) => e.attributes.title)).toStrictEqual(["C", "B", "A"]);
  });

  it("sorts by a numeric field ascending", () => {
    const events = [makeEvent({ cost: 3 }), makeEvent({ cost: 1 }), makeEvent({ cost: 2 })];
    const sorted = sortEventsMulti(events, [{ field: "cost", dir: "asc" }]);
    expect(sorted.map((e) => e.attributes.cost)).toStrictEqual([1, 2, 3]);
  });

  it("applies secondary sort as tiebreaker", () => {
    const events = [
      makeEvent({ cost: 10, title: "B" }),
      makeEvent({ cost: 5, title: "A" }),
      makeEvent({ cost: 10, title: "A" }),
    ];
    const sorted = sortEventsMulti(events, [
      { field: "cost", dir: "asc" },
      { field: "title", dir: "asc" },
    ]);
    expect(sorted.map((e) => `${e.attributes.cost}:${e.attributes.title}`)).toStrictEqual([
      "5:A",
      "10:A",
      "10:B",
    ]);
  });

  it("does not mutate the original array", () => {
    const events = [makeEvent({ title: "B" }), makeEvent({ title: "A" })];
    sortEventsMulti(events, [{ field: "title", dir: "asc" }]);
    expect(events[0].attributes.title).toBe("B");
  });
});
