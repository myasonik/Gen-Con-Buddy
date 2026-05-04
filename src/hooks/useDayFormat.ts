import { useStoredState } from "./useStoredState";
import type { DayFormat } from "../components/EventTable/types";

const STORAGE_KEY = "gcb-day-format";
const VERSION = 1;
const DEFAULT: DayFormat = "day";

export function useDayFormat(): {
  dayFormat: DayFormat;
  setDayFormat: (v: DayFormat) => void;
  reset: () => void;
} {
  const [dayFormat, setState] = useStoredState<DayFormat>(STORAGE_KEY, VERSION, DEFAULT);

  return {
    dayFormat,
    setDayFormat: (v: DayFormat) => setState(v),
    reset: () => setState(DEFAULT),
  };
}
