import { afterEach, beforeEach, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw/server";
import { makeEvent } from "../test/msw/factory";
import { queryClient } from "../lib/queryClient";
import { renderRoute } from "../test/renderRoute";
import type { EventSearchResponse } from "../utils/types";

const { captureFn } = vi.hoisted(() => ({ captureFn: vi.fn<() => void>() }));
vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: unknown }): unknown => children,
  usePostHog: (): { capture: typeof captureFn } => ({ capture: captureFn }),
}));

beforeEach(() => {
  captureFn.mockClear();
});

afterEach(() => {
  queryClient.clear();
});

test("renders event detail page inside a main landmark", async () => {
  await renderRoute("/event/RPG24000042", { queryClient });
  expect(screen.getByRole("main")).toBeInTheDocument();
});

test("passes the route param gameId to the API", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "BGM24000099" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/event/BGM24000099", { queryClient });
  await screen.findAllByRole("term");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get("gameId")).toBe("BGM24000099");
});

test("renders the event title from the URL gameId param", async () => {
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "";
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: "Dungeon Crawl Classic" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/event/RPG24000042", { queryClient });
  await expect(screen.findByText("Dungeon Crawl Classic")).resolves.toBeInTheDocument();
});

test("has exactly one h1 on the event detail page", async () => {
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "";
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: "Only Heading Here" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/event/RPG24000001", { queryClient });
  await screen.findByText("Only Heading Here");
  expect(document.querySelectorAll("h1")).toHaveLength(1);
});

test("loader pre-fetches event data so the component renders without loading state", async () => {
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "";
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: "Pre-fetched Event" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/event/RPG24000001", { queryClient });
  // loader primed the cache; component should render data immediately
  await expect(screen.findByText("Pre-fetched Event")).resolves.toBeInTheDocument();
  expect(screen.queryByText("LOADING QUEST...")).not.toBeInTheDocument();
});

test("event_detail_viewed fires with event attributes after data loads", async () => {
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "RPG24000042";
      return HttpResponse.json<EventSearchResponse>({
        data: [makeEvent({ gameId, title: "Dragon Hunt", eventType: "RPG", cost: 4 })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      });
    }),
  );
  await renderRoute("/event/RPG24000042", { queryClient });
  await screen.findAllByRole("term");
  expect(captureFn).toHaveBeenCalledWith(
    "event_detail_viewed",
    expect.objectContaining({ game_id: "RPG24000042", title: "Dragon Hunt", event_type: "RPG" }),
  );
});

test("google_calendar_clicked fires when calendar link is clicked", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "RPG24000042";
      return HttpResponse.json<EventSearchResponse>({
        data: [makeEvent({ gameId, title: "Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      });
    }),
  );
  await renderRoute("/event/RPG24000042", { queryClient });
  const link = await screen.findByRole("link", { name: /Add to Google Calendar/ });
  captureFn.mockClear();
  await user.click(link);
  expect(captureFn).toHaveBeenCalledWith(
    "google_calendar_clicked",
    expect.objectContaining({ title: "Dragon Hunt" }),
  );
});

test("gencon_link_clicked fires when Gen Con link is clicked", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "RPG24000042";
      return HttpResponse.json<EventSearchResponse>({
        data: [makeEvent({ gameId, title: "Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      });
    }),
  );
  await renderRoute("/event/RPG24000042", { queryClient });
  const link = await screen.findByRole("link", { name: /View on Gen Con/ });
  captureFn.mockClear();
  await user.click(link);
  expect(captureFn).toHaveBeenCalledWith(
    "gencon_link_clicked",
    expect.objectContaining({ title: "Dragon Hunt" }),
  );
});
