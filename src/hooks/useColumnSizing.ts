import { useEffect } from "react";
import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table";
import { useStoredState } from "./useStoredState";

const STORAGE_KEY = "gcb-column-sizing";
const VERSION = 1;

export function useColumnSizing(): {
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  reset: () => void;
} {
  const [sizingState, setSizingState] = useStoredState<ColumnSizingState>(STORAGE_KEY, VERSION, {});

  useEffect(() => {
    if (Object.keys(sizingState).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [sizingState]);

  const setSizing: OnChangeFn<ColumnSizingState> = (updaterOrValue): void => {
    setSizingState((prev) =>
      typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue,
    );
  };

  const reset = (): void => {
    setSizingState({});
  };

  return { sizing: sizingState, setSizing, reset };
}
