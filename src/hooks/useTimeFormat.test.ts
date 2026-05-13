import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimeFormat } from "./useTimeFormat";

const STORAGE_KEY = "gcb-time-format";

beforeEach(() => {
  localStorage.clear();
});

test("returns default timeFormat of 'auto' on first use", () => {
  const { result } = renderHook(() => useTimeFormat());
  expect(result.current.timeFormat).toBe("auto");
});

test("setTimeFormat updates timeFormat", () => {
  const { result } = renderHook(() => useTimeFormat());
  act(() => {
    result.current.setTimeFormat("24h");
  });
  expect(result.current.timeFormat).toBe("24h");
});

test("persists value to localStorage and loads it back", () => {
  const { result } = renderHook(() => useTimeFormat());
  act(() => {
    result.current.setTimeFormat("12h");
  });
  const { result: result2 } = renderHook(() => useTimeFormat());
  expect(result2.current.timeFormat).toBe("12h");
});

test("reset restores default", () => {
  const { result } = renderHook(() => useTimeFormat());
  act(() => {
    result.current.setTimeFormat("24h");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.timeFormat).toBe("auto");
});

test("resets to default when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "24h" }));
  const { result } = renderHook(() => useTimeFormat());
  expect(result.current.timeFormat).toBe("auto");
});

test("resets to default when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTimeFormat());
  expect(result.current.timeFormat).toBe("auto");
});
