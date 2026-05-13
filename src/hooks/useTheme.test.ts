import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, expect, test, beforeEach, afterEach } from "vitest";
import { useTheme } from "./useTheme";
import { __reset } from "../lib/announce";

const STORAGE_KEY = "gcb-theme";

function setupLiveRegions(): () => void {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  document.body.appendChild(polite);
  return () => polite.remove();
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  __reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("defaults to 'auto' when localStorage is empty", () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe("auto");
});

test("setTheme updates the stored preference", () => {
  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.setTheme("dark");
  });
  expect(result.current.theme).toBe("dark");
});

test("persists theme to localStorage and loads it back", () => {
  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.setTheme("light");
  });
  const { result: result2 } = renderHook(() => useTheme());
  expect(result2.current.theme).toBe("light");
});

test("reset restores 'auto'", () => {
  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.setTheme("dark");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.theme).toBe("auto");
});

test("resets to 'auto' when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "dark" }));
  const { result } = renderHook(() => useTheme());
  expect(result.current.theme).toBe("auto");
});

test("resolvedTheme is 'light' when OS is light and theme is 'auto'", () => {
  // setup.ts matchMedia mock returns matches: false by default
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolvedTheme).toBe("light");
});

test("resolvedTheme is 'dark' when OS is dark and theme is 'auto'", () => {
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
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolvedTheme).toBe("dark");
});

test("resolvedTheme follows explicit 'dark' preference regardless of OS", () => {
  // OS is light (matches: false default), but user chose dark
  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.setTheme("dark");
  });
  expect(result.current.resolvedTheme).toBe("dark");
});

test("resolvedTheme follows explicit 'light' preference regardless of OS", () => {
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
  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.setTheme("light");
  });
  expect(result.current.resolvedTheme).toBe("light");
});

test("applies data-theme attribute to documentElement", () => {
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
  renderHook(() => useTheme());
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});

test("applies colorScheme style to documentElement", () => {
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
  renderHook(() => useTheme());
  expect(document.documentElement.style.colorScheme).toBe("dark");
});

test("updates data-theme when preference changes", () => {
  const { result } = renderHook(() => useTheme());
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  act(() => {
    result.current.setTheme("dark");
  });
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});

test("announces when OS changes while theme is 'auto'", async () => {
  const cleanup = setupLiveRegions();
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

  renderHook(() => useTheme()); // theme === "auto", OS currently light

  act(() => {
    listeners.forEach((fn) => fn({ matches: true } as MediaQueryListEvent));
  });

  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe(
      "Theme updated to dark (Auto)",
    );
  });

  cleanup();
});

test("does not announce on mount", async () => {
  const cleanup = setupLiveRegions();
  renderHook(() => useTheme());
  // Wait longer than announce's 150ms delay to catch any announcements
  await new Promise((r) => setTimeout(r, 250));
  expect(document.getElementById("live-polite")?.textContent ?? "").toBe("");
  cleanup();
});

test("does not announce OS change when preference is explicit 'dark'", async () => {
  const cleanup = setupLiveRegions();
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

  const { result } = renderHook(() => useTheme());
  act(() => {
    result.current.setTheme("dark");
  });

  act(() => {
    listeners.forEach((fn) => fn({ matches: true } as MediaQueryListEvent));
  });

  await new Promise((r) => setTimeout(r, 250));
  expect(document.getElementById("live-polite")?.textContent ?? "").toBe("");

  cleanup();
});
