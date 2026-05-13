import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import type { DayFormat, TimeZone } from "../components/EventTable/types";

export function toDisplayDate(value: string, timeZone: TimeZone): Date {
  return timeZone === "indy"
    ? new TZDate(value, "America/Indiana/Indianapolis")
    : new Date(value);
}

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
