import { renderHook, act } from "@testing-library/react";
import { useSidebarOpen } from "./useSidebarOpen";

const KEY = "sidebarOpen";

beforeEach(() => {
  localStorage.clear();
});

test("defaults to true when localStorage has no entry", () => {
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(true);
});

test("toggle flips from true to false", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  expect(result.current[0]).toBe(false);
});

test("toggle flips from false back to true", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  act(() => {
    result.current[1]();
  });
  expect(result.current[0]).toBe(true);
});

test("persists state to localStorage on toggle", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  const { result: result2 } = renderHook(() => useSidebarOpen());
  expect(result2.current[0]).toBe(false);
});

test("reads existing true value from localStorage", () => {
  localStorage.setItem(KEY, "true");
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(true);
});

test("reads existing false value from localStorage", () => {
  localStorage.setItem(KEY, "false");
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(false);
});

test("defaults to true when localStorage value is not 'true' or 'false'", () => {
  localStorage.setItem(KEY, "garbage");
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(true);
});
