import { useRef, useEffect } from "react";
import { useStoredState } from "./useStoredState";
import { useMediaQuery } from "./useMediaQuery";
import { announce } from "../lib/announce";

export type ThemePreference = "light" | "dark" | "auto";

const STORAGE_KEY = "gcb-theme";
const VERSION = 1;
const DEFAULT: ThemePreference = "auto";

export function useTheme(): {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (v: ThemePreference) => void;
  reset: () => void;
} {
  const [theme, setState] = useStoredState<ThemePreference>(STORAGE_KEY, VERSION, DEFAULT);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolved: "light" | "dark" = theme === "auto" ? (prefersDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const prevDarkRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevDarkRef.current !== null && prevDarkRef.current !== prefersDark && theme === "auto") {
      announce(`Theme updated to ${prefersDark ? "dark" : "light"} (Auto)`);
    }
    prevDarkRef.current = prefersDark;
  }, [prefersDark, theme]);

  return {
    theme,
    resolvedTheme: resolved,
    setTheme: (v: ThemePreference) => setState(v),
    reset: () => setState(DEFAULT),
  };
}
