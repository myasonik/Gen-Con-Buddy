import { expect, describe, it } from "vitest";
import { getSortField, getColId } from "./columns";

describe("getSortField", () => {
  it("returns sortField for a known column id (title)", () => {
    expect(getSortField("title")).toBe("title");
  });

  it("returns sortField for a known column id (day)", () => {
    expect(getSortField("day")).toBe("startDateTime");
  });

  it("returns sortField for a known column id (startDateTime)", () => {
    expect(getSortField("startDateTime")).toBe("startDateTime");
  });

  it("returns sortField for a known column id (ticketsAvailable)", () => {
    expect(getSortField("ticketsAvailable")).toBe("ticketsAvailable");
  });

  it("throws for an unknown column id", () => {
    expect(() => getSortField("unknownColumn")).toThrow("Unknown column id: unknownColumn");
  });

  it("throws for an empty string column id", () => {
    expect(() => getSortField("")).toThrow("Unknown column id: ");
  });
});

describe("getColId", () => {
  it("returns colId for a known sort field (title)", () => {
    expect(getColId("title")).toBe("title");
  });

  it("returns colId for a known sort field (startDateTime)", () => {
    expect(getColId("startDateTime")).toBe("startDateTime");
  });

  it("returns colId for a known sort field (ticketsAvailable)", () => {
    expect(getColId("ticketsAvailable")).toBe("ticketsAvailable");
  });

  it("throws for an unknown sort field", () => {
    expect(() => getColId("unknownField")).toThrow("Unknown sort field: unknownField");
  });

  it("throws for an empty string sort field", () => {
    expect(() => getColId("")).toThrow("Unknown sort field: ");
  });
});
