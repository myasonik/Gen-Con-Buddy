import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypeDisplay } from "./useTypeDisplay";

const STORAGE_KEY = "gen-con-buddy-type-display";

beforeEach(() => {
  localStorage.clear();
});

test("returns 'both' as the default value", () => {
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("both");
});

test("setTypeDisplay updates the value", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
  });
  expect(result.current.typeDisplay).toBe("code");
});

test("persists the value to localStorage", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("name");
  });
  const { result: result2 } = renderHook(() => useTypeDisplay());
  expect(result2.current.typeDisplay).toBe("name");
});

test("reset restores the value to 'both'", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.typeDisplay).toBe("both");
});

test("falls back to 'both' when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "code" }));
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("both");
});

test("falls back to 'both' when stored data is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("both");
});
