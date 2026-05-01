// src/ui/EventTable/types.ts
import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";
import type { TypeDisplay } from "../../hooks/useTypeDisplay";

export interface SharedColumnState {
  visibility: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  resetVisibility: () => void;
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  resetSizing: () => void;
  typeDisplay?: TypeDisplay;
  setTypeDisplay?: (value: TypeDisplay) => void;
}
