import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimeZone } from "./useTimeZone";

const STORAGE_KEY = "gcb-time-zone";

beforeEach(() => {
  localStorage.clear();
});

test("returns default timeZone of 'indy' on first use", () => {
  const { result } = renderHook(() => useTimeZone());
  expect(result.current.timeZone).toBe("indy");
});

test("setTimeZone updates timeZone", () => {
  const { result } = renderHook(() => useTimeZone());
  act(() => {
    result.current.setTimeZone("local");
  });
  expect(result.current.timeZone).toBe("local");
});

test("persists value to localStorage and loads it back", () => {
  const { result } = renderHook(() => useTimeZone());
  act(() => {
    result.current.setTimeZone("local");
  });
  const { result: result2 } = renderHook(() => useTimeZone());
  expect(result2.current.timeZone).toBe("local");
});

test("reset restores default", () => {
  const { result } = renderHook(() => useTimeZone());
  act(() => {
    result.current.setTimeZone("local");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.timeZone).toBe("indy");
});

test("resets to default when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "local" }));
  const { result } = renderHook(() => useTimeZone());
  expect(result.current.timeZone).toBe("indy");
});

test("resets to default when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTimeZone());
  expect(result.current.timeZone).toBe("indy");
});
