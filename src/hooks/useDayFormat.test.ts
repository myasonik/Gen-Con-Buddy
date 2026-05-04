import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDayFormat } from "./useDayFormat";

const STORAGE_KEY = "gcb-day-format";

beforeEach(() => {
  localStorage.clear();
});

test("returns default dayFormat of 'day' on first use", () => {
  const { result } = renderHook(() => useDayFormat());
  expect(result.current.dayFormat).toBe("day");
});

test("setDayFormat updates dayFormat", () => {
  const { result } = renderHook(() => useDayFormat());
  act(() => {
    result.current.setDayFormat("numeric");
  });
  expect(result.current.dayFormat).toBe("numeric");
});

test("persists value to localStorage and loads it back", () => {
  const { result } = renderHook(() => useDayFormat());
  act(() => {
    result.current.setDayFormat("long");
  });
  const { result: result2 } = renderHook(() => useDayFormat());
  expect(result2.current.dayFormat).toBe("long");
});

test("reset restores default", () => {
  const { result } = renderHook(() => useDayFormat());
  act(() => {
    result.current.setDayFormat("numeric");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.dayFormat).toBe("day");
});

test("resets to default when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "numeric" }));
  const { result } = renderHook(() => useDayFormat());
  expect(result.current.dayFormat).toBe("day");
});

test("resets to default when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useDayFormat());
  expect(result.current.dayFormat).toBe("day");
});
