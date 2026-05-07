import { expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw/server";
import { fetchEvents, fetchChangelogList, fetchChangelogEntry, fetchGameSystemFacets } from "./api";
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  GameSystemFacetsResponse,
} from "./types";
import { makeChangelogSummary, makeChangelogEntry } from "../test/msw/factory";

const EMPTY_RESPONSE: EventSearchResponse = {
  data: [],
  meta: { total: 0 },
  links: { self: "/api/events/search" },
  error: null,
};

function captureUrl(): { getUrl: () => URL | null } {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json(EMPTY_RESPONSE);
    }),
  );
  return { getUrl: () => capturedUrl };
}

test("fetchEvents throws when response contains error field", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json<EventSearchResponse>({
        data: [],
        meta: { total: 0 },
        links: { self: "/api/events/search" },
        error: { status: "500", detail: "Something went wrong on the server" },
      }),
    ),
  );
  await expect(fetchEvents({})).rejects.toThrow("Something went wrong on the server");
});

test("serializes single eventType code directly", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "BGM" });
  expect(getUrl()?.searchParams.get("eventType")).toBe("BGM");
});

test("serializes multiple eventType codes as comma-separated", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "RPG,BGM" });
  expect(getUrl()?.searchParams.get("eventType")).toBe("RPG,BGM");
});

test("omits eventType when value is empty string", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "" });
  expect(getUrl()?.searchParams.has("eventType")).toBe(false);
});

// fetchChangelogList

test("fetchChangelogList returns summaries on success", async () => {
  const summary = makeChangelogSummary({ id: "entry-1" });
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ entries: [summary] }),
    ),
  );
  const result = await fetchChangelogList();
  expect(result).toStrictEqual([summary]);
});

test("fetchChangelogList sends limit param", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/changelog/list", ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json<ListChangelogsResponse>({ entries: [] });
    }),
  );
  await fetchChangelogList(10);
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get("limit")).toBe("10");
});

test("fetchChangelogList throws on HTTP error", async () => {
  server.use(http.get("/api/changelog/list", () => new HttpResponse(null, { status: 500 })));
  await expect(fetchChangelogList()).rejects.toThrow("HTTP 500");
});

test("fetchChangelogList throws when response contains error field", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ error: "not found" }),
    ),
  );
  await expect(fetchChangelogList()).rejects.toThrow("not found");
});

// fetchChangelogEntry

test("fetchChangelogEntry returns entry on success", async () => {
  const entry = makeChangelogEntry({ id: "entry-1" });
  server.use(
    http.get("/api/changelog/fetch", () => HttpResponse.json<FetchChangelogResponse>({ entry })),
  );
  const result = await fetchChangelogEntry("entry-1");
  expect(result).toStrictEqual(entry);
});

test("fetchChangelogEntry sends id param", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/changelog/fetch", ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: "entry-1" }),
      });
    }),
  );
  await fetchChangelogEntry("entry-1");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get("id")).toBe("entry-1");
});

test("fetchChangelogEntry throws on HTTP error", async () => {
  server.use(http.get("/api/changelog/fetch", () => new HttpResponse(null, { status: 404 })));
  await expect(fetchChangelogEntry("entry-1")).rejects.toThrow("HTTP 404");
});

test("fetchChangelogEntry throws when response contains error field", async () => {
  server.use(
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({ error: "forbidden" }),
    ),
  );
  await expect(fetchChangelogEntry("entry-1")).rejects.toThrow("forbidden");
});

test("fetchChangelogEntry throws when entry is missing from response", async () => {
  server.use(http.get("/api/changelog/fetch", () => HttpResponse.json<FetchChangelogResponse>({})));
  await expect(fetchChangelogEntry("entry-1")).rejects.toThrow("Missing entry");
});

// fetchGameSystemFacets

test("fetchGameSystemFacets returns facets on success", async () => {
  const result = await fetchGameSystemFacets();
  expect(result).toStrictEqual([
    { value: "Dungeons & Dragons 5E", count: 142 },
    { value: "Pathfinder 2E", count: 87 },
    { value: "Call of Cthulhu", count: 45 },
  ]);
});

test("fetchGameSystemFacets throws on HTTP error", async () => {
  server.use(
    http.get("/api/events/facets/gameSystem", () => new HttpResponse(null, { status: 500 })),
  );
  await expect(fetchGameSystemFacets()).rejects.toThrow("HTTP 500");
});

test("fetchGameSystemFacets throws when response contains error field", async () => {
  server.use(
    http.get("/api/events/facets/gameSystem", () =>
      HttpResponse.json<GameSystemFacetsResponse>({ error: "unavailable" }),
    ),
  );
  await expect(fetchGameSystemFacets()).rejects.toThrow("unavailable");
});
