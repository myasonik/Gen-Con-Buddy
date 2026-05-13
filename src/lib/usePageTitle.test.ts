import { renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { usePageTitle } from "./usePageTitle";

afterEach(() => {
  document.title = "Gen Con Buddy";
});

test("sets document.title when given a non-empty string", () => {
  renderHook(() => usePageTitle("Dungeon Crawl Classic (RPG24000042) | Gen Con Buddy"));
  expect(document.title).toBe("Dungeon Crawl Classic (RPG24000042) | Gen Con Buddy");
});

test("does nothing when given undefined", () => {
  document.title = "Previous Title";
  renderHook(() => usePageTitle(undefined));
  expect(document.title).toBe("Previous Title");
});

test("resets document.title to 'Gen Con Buddy' on unmount", () => {
  const { unmount } = renderHook(() => usePageTitle("Some Page | Gen Con Buddy"));
  unmount();
  expect(document.title).toBe("Gen Con Buddy");
});
