import { expect, test } from "vitest";
import { normalizeEmail } from "./normalizeEmail";

test("returns null for empty string", () => {
  expect(normalizeEmail("")).toBeNull();
});

test("returns mailto: URL for a valid email", () => {
  expect(normalizeEmail("foo@example.com")).toBe("mailto:foo@example.com");
});

test("returns null when there is no @", () => {
  expect(normalizeEmail("notanemail")).toBeNull();
});

test("returns null when there are two @ signs", () => {
  expect(normalizeEmail("foo@bar@example.com")).toBeNull();
});

test("returns null when there is whitespace", () => {
  expect(normalizeEmail("foo @example.com")).toBeNull();
});

test("returns null when the domain has no dot", () => {
  expect(normalizeEmail("foo@localhost")).toBeNull();
});
