import { renderHook, act } from "@testing-library/react";
import { vi, test, expect, afterEach } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

afterEach(() => {
  vi.restoreAllMocks();
});

test("returns false when media query does not match on mount", () => {
  const { result } = renderHook(() => useMediaQuery("(width <= 60rem)"));
  expect(result.current).toBe(false);
});

test("returns true when media query matches on mount", () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }) as unknown as MediaQueryList,
  );

  const { result } = renderHook(() => useMediaQuery("(width <= 60rem)"));
  expect(result.current).toBe(true);
});

test("updates when the media query match changes", () => {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];

  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_type: string, handler: EventListenerOrEventListenerObject): void => {
          listeners.push(handler as (e: MediaQueryListEvent) => void);
        },
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }) as unknown as MediaQueryList,
  );

  const { result } = renderHook(() => useMediaQuery("(width <= 60rem)"));
  expect(result.current).toBe(false);

  act(() => {
    listeners.forEach((fn) => fn({ matches: true } as MediaQueryListEvent));
  });

  expect(result.current).toBe(true);
});

test("unsubscribes from matchMedia on unmount", () => {
  const removeEventListener = vi.fn<() => void>();

  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn<() => void>(),
        removeEventListener,
        dispatchEvent: vi.fn<() => boolean>(),
      }) as unknown as MediaQueryList,
  );

  const { unmount } = renderHook(() => useMediaQuery("(width <= 60rem)"));
  unmount();

  expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});
