import { useColumnVisibility } from "./useColumnVisibility";
import { useColumnSizing } from "./useColumnSizing";
import { useTypeDisplay } from "./useTypeDisplay";
import { useDayFormat } from "./useDayFormat";
import { useTimeZone } from "./useTimeZone";
import { useTimeFormat } from "./useTimeFormat";
import type { SharedColumnState } from "../components/EventTable/types";

export function useSharedColumnState(): SharedColumnState {
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  const { timeZone, setTimeZone, reset: resetTimeZone } = useTimeZone();
  const { timeFormat, setTimeFormat, reset: resetTimeFormat } = useTimeFormat();
  return {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
    timeZone,
    setTimeZone,
    resetTimeZone,
    timeFormat,
    setTimeFormat,
    resetTimeFormat,
  };
}
