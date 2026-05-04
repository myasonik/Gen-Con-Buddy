import { format } from "date-fns";
import type { EventAttributes } from "./types";

export function genConEventId(gameId: string): string {
  return /(\d+)$/.exec(gameId)?.[1] ?? gameId;
}

export function buildGoogleCalendarUrl(attrs: EventAttributes): string {
  const formatDate = (iso: string): string => format(new Date(iso), "yyyyMMdd'T'HHmmss");

  const parts = [attrs.location, attrs.roomName].filter(Boolean);
  let location = parts.join(" — ");
  if (attrs.tableNumber) {
    location += `, Table ${attrs.tableNumber}`;
  }

  const lines: string[] = [];
  if (attrs.longDescription) {
    lines.push(attrs.longDescription);
    lines.push("");
  }
  if (attrs.gmNames) {
    lines.push(`GM(s): ${attrs.gmNames}`);
  }
  lines.push(`Location: ${location}`);
  lines.push(`Cost: $${attrs.cost.toFixed(2)}`);
  lines.push(`Duration: ${attrs.duration} hours`);
  if (attrs.experienceRequired) {
    lines.push(`Experience Required: ${attrs.experienceRequired}`);
  }
  if (attrs.materialsRequired) {
    lines.push(`Materials Required: ${attrs.materialsRequired}`);
  }
  if (attrs.materialsRequiredDetails) {
    lines.push(`Materials Details: ${attrs.materialsRequiredDetails}`);
  }
  lines.push("");
  lines.push(`Gen Con event page: https://www.gencon.com/events/${genConEventId(attrs.gameId)}`);

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", attrs.title);
  url.searchParams.set(
    "dates",
    `${formatDate(attrs.startDateTime)}/${formatDate(attrs.endDateTime)}`,
  );
  url.searchParams.set("details", lines.join("\n"));
  url.searchParams.set("location", location);

  return url.toString();
}
