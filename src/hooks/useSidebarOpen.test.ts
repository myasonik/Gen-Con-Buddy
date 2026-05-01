import { expect, test } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSidebarOpen } from "./useSidebarOpen";

test("defaults to closed on mount", () => {
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(false);
});

test("toggle flips from false to true", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  expect(result.current[0]).toBe(true);
});

test("toggle flips from true back to false", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  act(() => {
    result.current[1]();
  });
  expect(result.current[0]).toBe(false);
});
