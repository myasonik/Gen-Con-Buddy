import { expect, test } from "vitest";
import { normalizeUrl } from "./normalizeUrl";

test("returns null for empty string", () => {
  expect(normalizeUrl("")).toBeNull();
});

test("returns the URL for a valid https:// input", () => {
  expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
});

test("returns the URL for a valid http:// input", () => {
  expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
});

test("prepends https:// for www. prefix", () => {
  expect(normalizeUrl("www.example.com")).toBe("https://www.example.com/");
});

test("prepends https:// for bare domain", () => {
  expect(normalizeUrl("example.com")).toBe("https://example.com/");
});

test("returns null for javascript: scheme", () => {
  expect(normalizeUrl("javascript:alert(1)")).toBeNull();
});

test("returns null for data: scheme", () => {
  expect(normalizeUrl("data:text/html,<h1>hi</h1>")).toBeNull();
});

test("returns null for a string that cannot form a valid URL", () => {
  expect(normalizeUrl("not a url with spaces")).toBeNull();
});
