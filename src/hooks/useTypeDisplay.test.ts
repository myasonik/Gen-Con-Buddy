import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypeDisplay } from "./useTypeDisplay";

const STORAGE_KEY = "gen-con-buddy-type-display";

beforeEach(() => {
  localStorage.clear();
});

test("returns default typeDisplay of 'name' on first use", () => {
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
});

test("returns showTypeIcon true by default", () => {
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.showTypeIcon).toBe(true);
});

test("setTypeDisplay updates typeDisplay", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
  });
  expect(result.current.typeDisplay).toBe("code");
});

test("setShowTypeIcon updates showTypeIcon", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setShowTypeIcon(false);
  });
  expect(result.current.showTypeIcon).toBe(false);
});

test("persists both values to localStorage and loads them back", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
    result.current.setShowTypeIcon(false);
  });
  const { result: result2 } = renderHook(() => useTypeDisplay());
  expect(result2.current.typeDisplay).toBe("code");
  expect(result2.current.showTypeIcon).toBe(false);
});

test("reset restores defaults", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("both");
    result.current.setShowTypeIcon(false);
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});

test("resets to defaults when stored version does not match", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 9999, value: { textMode: "code", showIcon: false } }),
  );
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});

test("resets to defaults when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});

test("resets to defaults when stored value is v1 plain-string format (pre-icon)", () => {
  // The hook originally stored a plain TypeDisplay string at version 1.
  // After adding showIcon the shape changed; bump to v2 rejects the old entry.
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, value: "both" }));
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});
