import { daysToStartDateTime } from "./searchParams";
import { EVENT_TYPES } from "./enums";
import type { EventSearchResponse, SearchParams } from "./types";

export async function fetchEvents(
  params: SearchParams,
): Promise<EventSearchResponse> {
  const url = new URL("/api/events/search", window.location.origin);
  if (params.days) {
    const startDateTime = daysToStartDateTime(params.days);
    if (startDateTime) url.searchParams.set("startDateTime", startDateTime);
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (key === "days") return;
    if (key === "page") {
      // URL uses 1-indexed; API uses 0-indexed. Omit when page=1 (API default is 0).
      if (typeof value === "number" && value > 1)
        url.searchParams.set("page", String(value - 1));
      return;
    }
    if (key === "limit") {
      // Omit when 100 (API default).
      if (typeof value === "number" && value !== 100)
        url.searchParams.set("limit", String(value));
      return;
    }
    if (key === "eventType" && typeof value === "string") {
      const labels = value
        .split(",")
        .map((code) => EVENT_TYPES[code] ?? code)
        .join(",");
      url.searchParams.set(key, labels);
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<EventSearchResponse>;
}
