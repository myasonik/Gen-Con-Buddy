import { useStoredState } from "./useStoredState";
import type { TimeZone } from "../components/EventTable/types";

const STORAGE_KEY = "gcb-time-zone";
const VERSION = 1;
const DEFAULT: TimeZone = "indy";

export function useTimeZone(): {
  timeZone: TimeZone;
  setTimeZone: (v: TimeZone) => void;
  reset: () => void;
} {
  const [timeZone, setState] = useStoredState<TimeZone>(STORAGE_KEY, VERSION, DEFAULT);

  return {
    timeZone,
    setTimeZone: (v: TimeZone) => setState(v),
    reset: () => setState(DEFAULT),
  };
}
