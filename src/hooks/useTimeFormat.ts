import { useStoredState } from "./useStoredState";
import type { TimeFormat } from "../components/EventTable/types";

const STORAGE_KEY = "gcb-time-format";
const VERSION = 1;
const DEFAULT: TimeFormat = "auto";

export function useTimeFormat(): {
  timeFormat: TimeFormat;
  setTimeFormat: (v: TimeFormat) => void;
  reset: () => void;
} {
  const [timeFormat, setState] = useStoredState<TimeFormat>(STORAGE_KEY, VERSION, DEFAULT);

  return {
    timeFormat,
    setTimeFormat: (v: TimeFormat) => setState(v),
    reset: () => setState(DEFAULT),
  };
}
