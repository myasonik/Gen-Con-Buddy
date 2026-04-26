import { daysToStartDateTime } from "./searchParams";
import type {
  EventSearchResponse,
  SearchParams,
  ListChangelogsResponse,
  FetchChangelogResponse,
  ChangelogEntry,
  ChangelogSummary,
} from "./types";

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
    url.searchParams.set(key, String(value));
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<EventSearchResponse>;
}

export async function fetchChangelogList(
  limit = 6,
): Promise<ChangelogSummary[]> {
  const url = new URL("/api/changelog/list", window.location.origin);
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ListChangelogsResponse;
  if (data.error) throw new Error(data.error);
  return data.entries ?? [];
}

export async function fetchChangelogEntry(id: string): Promise<ChangelogEntry> {
  const url = new URL("/api/changelog/fetch", window.location.origin);
  url.searchParams.set("id", id);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as FetchChangelogResponse;
  if (data.error) throw new Error(data.error);
  if (!data.entry) throw new Error("Missing entry in response");
  return data.entry;
}
