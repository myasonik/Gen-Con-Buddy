import { http, HttpResponse } from "msw";
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
} from "../../utils/types";
import { makeEvent, makeChangelogSummary, makeChangelogEntry } from "./factory";

export const handlers = [
  http.get("/api/events/search", () => {
    const response: EventSearchResponse = {
      data: [
        makeEvent({ gameId: "RPG24000001", title: "Test RPG Event" }),
        makeEvent({
          gameId: "BGM24000001",
          title: "Test Board Game",
          eventType: "BGM",
        }),
      ],
      meta: { total: 2 },
      links: { self: "/api/events/search" },
      error: null,
    };
    return HttpResponse.json(response);
  }),
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
];
