import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";

export type TypeDisplay = "code" | "name" | "both";
export type DayFormat = "day" | "numeric" | "long";
export type TimeZone = "indy" | "local";

export interface SharedColumnState {
  visibility: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  resetVisibility: () => void;
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  resetSizing: () => void;
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
  resetTypeDisplay: () => void;
  dayFormat: DayFormat;
  setDayFormat: (v: DayFormat) => void;
  resetDayFormat: () => void;
  timeZone: TimeZone;
  setTimeZone: (v: TimeZone) => void;
  resetTimeZone: () => void;
}
