import { expect, test } from "vitest";
import { isSoldOut } from "./isSoldOut";

test("returns true when ticketsAvailable is 0", () => {
  expect(isSoldOut(0)).toBe(true);
});

test("returns true when ticketsAvailable is negative", () => {
  expect(isSoldOut(-1)).toBe(true);
  expect(isSoldOut(-99)).toBe(true);
});

test("returns false when ticketsAvailable is positive", () => {
  expect(isSoldOut(1)).toBe(false);
  expect(isSoldOut(100)).toBe(false);
});
