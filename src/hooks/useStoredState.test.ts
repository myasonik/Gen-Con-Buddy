import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStoredState } from "./useStoredState";

const KEY = "test-stored-state";

beforeEach(() => {
  localStorage.clear();
});

test("returns defaultValue on first use", () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  expect(result.current[0]).toStrictEqual({ count: 0 });
});

test("setValue updates the state", () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  act(() => {
    result.current[1]({ count: 5 });
  });
  expect(result.current[0]).toStrictEqual({ count: 5 });
});

test("setValue with updater function updates the state", () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  act(() => {
    result.current[1]((prev) => ({ count: prev.count + 1 }));
  });
  expect(result.current[0]).toStrictEqual({ count: 1 });
});

test("persists value to localStorage", () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  act(() => {
    result.current[1]({ count: 42 });
  });
  const stored = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  expect(stored).toStrictEqual({ version: 1, value: { count: 42 } });
});

test("loads persisted value on remount", () => {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, value: { count: 7 } }));
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  expect(result.current[0]).toStrictEqual({ count: 7 });
});

test("falls back to default when version mismatches", () => {
  localStorage.setItem(KEY, JSON.stringify({ version: 9999, value: { count: 99 } }));
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  expect(result.current[0]).toStrictEqual({ count: 0 });
});

test("falls back to default when storage is malformed", () => {
  localStorage.setItem(KEY, "not-json{{{");
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  expect(result.current[0]).toStrictEqual({ count: 0 });
});

test("falls back to default when stored entry has matching version but no value key", () => {
  localStorage.setItem(KEY, JSON.stringify({ version: 1 }));
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }));
  expect(result.current[0]).toStrictEqual({ count: 0 });
});

test("does not write stale value to storage when version changes mid-lifecycle", () => {
  const { result, rerender } = renderHook(
    ({ version }: { version: number }) => useStoredState(KEY, version, { count: 0 }),
    { initialProps: { version: 1 } },
  );

  // Set a value under version 1
  act(() => {
    result.current[1]({ count: 99 });
  });

  // Confirm version 1 data is in storage
  expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toStrictEqual({
    version: 1,
    value: { count: 99 },
  });

  // Change version mid-lifecycle
  act(() => {
    rerender({ version: 2 });
  });

  // State must reset to default — old value belongs to version 1
  expect(result.current[0]).toStrictEqual({ count: 0 });

  const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");

  // Storage must NOT contain stale version-1 data under the version-2 key
  expect(stored).not.toStrictEqual({ version: 2, value: { count: 99 } });

  // Storage must contain the correct version-2 write (default value)
  expect(stored).toStrictEqual({ version: 2, value: { count: 0 } });
});
