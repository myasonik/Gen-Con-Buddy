import { format } from "date-fns";
import type { DayFormat } from "../components/EventTable/types";

export function formatDay(date: Date, dayFormat: DayFormat): string {
  switch (dayFormat) {
    case "numeric":
      return format(date, "MM/dd/yy");
    case "long":
      return format(date, "EEE, MMM dd, yyyy");
    default:
      return format(date, "EEEE");
  }
}

export function formatDayCompact(date: Date, dayFormat: DayFormat): string {
  switch (dayFormat) {
    case "numeric":
      return format(date, "M/d");
    case "long":
      return format(date, "EEE M/d");
    default:
      return format(date, "EEE");
  }
}
