import { daysAndTimeToStartDateTime } from "./searchParams";
import { DEFAULT_PAGE_SIZE } from "./constants";
import type {
  EventSearchResponse,
  SearchParams,
  ListChangelogsResponse,
  FetchChangelogResponse,
  ChangelogEntry,
  ChangelogSummary,
  GameSystemFacet,
  GameSystemFacetsResponse,
} from "./types";

export async function fetchEvents(params: SearchParams): Promise<EventSearchResponse> {
  const url = new URL("/api/events/search", window.location.origin);

  if (params.days || params.timeStart || params.timeEnd) {
    const days = params.days ?? "wed,thu,fri,sat,sun";
    const startDateTime = daysAndTimeToStartDateTime(days, params.timeStart, params.timeEnd);
    if (startDateTime) {
      url.searchParams.set("startDateTime", startDateTime);
    }
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    if (key === "days" || key === "timeStart" || key === "timeEnd") {
      return;
    }
    if (key === "page") {
      // URL uses 1-indexed; API uses 0-indexed. Omit when page=1 (API default is 0).
      if (typeof value === "number" && value > 1) {
        url.searchParams.set("page", String(value - 1));
      }
      return;
    }
    if (key === "limit") {
      // Omit when DEFAULT_PAGE_SIZE (API default).
      if (typeof value === "number" && value !== DEFAULT_PAGE_SIZE) {
        url.searchParams.set("limit", String(value));
      }
      return;
    }
    url.searchParams.set(key, String(value));
  });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as EventSearchResponse;
  if (data.error) {
    throw new Error(data.error.detail);
  }
  return { ...data, data: data.data ?? [] };
}

export async function fetchChangelogList(): Promise<ChangelogSummary[]> {
  const url = new URL("/api/changelog/list", window.location.origin);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as ListChangelogsResponse;
  if (data.error) {
    throw new Error(data.error);
  }
  return data.entries ?? [];
}

export async function fetchChangelogEntry(id: string): Promise<ChangelogEntry> {
  const url = new URL("/api/changelog/fetch", window.location.origin);
  url.searchParams.set("id", id);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as FetchChangelogResponse;
  if (data.error) {
    throw new Error(data.error);
  }
  if (!data.entry) {
    throw new Error("Missing entry in response");
  }
  return data.entry;
}

export async function fetchGameSystemFacets(): Promise<GameSystemFacet[]> {
  const url = new URL("/api/events/facets/gameSystem", window.location.origin);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as GameSystemFacetsResponse;
  if (data.error) {
    throw new Error(data.error);
  }
  return data.values ?? [];
}
