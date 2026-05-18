import { http, HttpResponse, type HttpHandler } from "msw";
import type {
  Event,
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  FacetResponse,
} from "../../utils/types";
import { makeEvent, makeChangelogSummary, makeChangelogEntry } from "./factory";

const DEFAULT_POOL: Event[] = Array.from({ length: 20 }, () => makeEvent());

function buildEventsHandler(pool: Event[]): HttpHandler {
  return http.get("/api/events/search", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "0", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? String(pool.length), 10);
    const sort = url.searchParams.get("sort");

    const sorted = [...pool];
    if (sort) {
      const [field, dir] = sort.split(".");
      sorted.sort((a, b) => {
        const aVal = (a.attributes as unknown as Record<string, unknown>)[field];
        const bVal = (b.attributes as unknown as Record<string, unknown>)[field];
        const aStr = String(aVal ?? "");
        const bStr = String(bVal ?? "");
        const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
        return dir === "desc" ? -cmp : cmp;
      });
    }

    const start = page * limit;
    const slice = sorted.slice(start, start + limit);

    const response: EventSearchResponse = {
      data: slice,
      meta: { total: pool.length },
      links: { self: request.url },
      error: null,
    };
    return HttpResponse.json(response);
  });
}

export function makeEventPool(events: Event[]): HttpHandler {
  return buildEventsHandler(events);
}

export function makeStaffPickHandler(events: Event[]): HttpHandler {
  return http.get("/api/events/search", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("gameId") !== null) {
      const response: EventSearchResponse = {
        data: events,
        meta: { total: events.length },
        links: { self: request.url },
        error: null,
      };
      return HttpResponse.json(response);
    }
  });
}

export const handlers = [
  buildEventsHandler(DEFAULT_POOL),
  http.get("/api/changelog/list", () => {
    const response: ListChangelogsResponse = {
      entries: [makeChangelogSummary({ id: "entry-1" })],
    };
    return HttpResponse.json(response);
  }),
  http.get("/api/changelog/fetch", () => {
    const response: FetchChangelogResponse = {
      entry: makeChangelogEntry({ id: "entry-1" }),
    };
    return HttpResponse.json(response);
  }),
  http.get("/api/events/facets/:field", ({ params }) => {
    const field = params.field as string;
    const gameSystemValues: FacetResponse["values"] = [
      { value: "Dungeons & Dragons 5E", count: 142 },
      { value: "Pathfinder 2E", count: 87 },
      { value: "Call of Cthulhu", count: 45 },
    ];
    const response: FacetResponse = {
      values:
        field === "gameSystem"
          ? gameSystemValues
          : [
              { value: "alpha", count: 100 },
              { value: "beta", count: 50 },
            ],
    };
    return HttpResponse.json(response);
  }),
];
