import { renderHook, act } from "@testing-library/react";
import { useColumnSizing } from "./useColumnSizing";

const STORAGE_KEY = "gcb-column-sizing";

beforeEach(() => {
  localStorage.clear();
});

test("returns empty sizing on first use", () => {
  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({});
});

test("setSizing with a value updates state", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 300 });
  });

  expect(result.current.sizing).toEqual({ title: 300 });
});

test("setSizing with an updater function updates state", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 200 });
  });
  act(() => {
    result.current.setSizing((prev) => ({ ...prev, gameId: 100 }));
  });

  expect(result.current.sizing).toEqual({ title: 200, gameId: 100 });
});

test("persists sizing to localStorage", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 300 });
  });

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(stored).toEqual({ version: 1, sizing: { title: 300 } });
});

test("loads sizing from localStorage on mount", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, sizing: { title: 300, gameId: 150 } }),
  );

  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({ title: 300, gameId: 150 });
});

test("returns empty sizing when stored version does not match", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 9999, sizing: { title: 300 } }),
  );

  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({});
});

test("returns empty sizing when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");

  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({});
});

test("reset clears sizing state and removes localStorage key", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 300 });
  });

  expect(result.current.sizing).toEqual({ title: 300 });

  act(() => {
    result.current.reset();
  });

  expect(result.current.sizing).toEqual({});
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});
