import { useState, useEffect } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

export function useStoredState<T>(
  key: string,
  version: number,
  defaultValue: T,
): [T, (next: SetStateAction<T>) => void] {
  const [value, setValue] = useState<T>(() => readFromStorage(key, version, defaultValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ version, value }));
    } catch {
      // ignore write errors
    }
  }, [key, version, value]);

  const setStoredValue = (next: SetStateAction<T>): void => {
    setValue((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  };

  return [value, setStoredValue];
}

function readFromStorage<T>(key: string, version: number, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return defaultValue;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== version
    ) {
      return defaultValue;
    }
    const stored = parsed as { version: number; value?: T };
    if (stored.value === undefined) {
      return defaultValue;
    }
    return stored.value;
  } catch {
    return defaultValue;
  }
}
