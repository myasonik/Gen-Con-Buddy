import { render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { makeEvent } from "../../test/msw/factory";
import { EventDetail } from "./EventDetail";
import type { EventSearchResponse } from "../../utils/types";

function renderEventDetail(gameId: string) {
  const rootRoute = createRootRoute({
    component: () => <EventDetail gameId={gameId} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

test("shows loading state while fetching", async () => {
  renderEventDetail("RPG24000001");
  expect(await screen.findByText("LOADING QUEST...")).toBeInTheDocument();
});

test("renders event title and gameId after load", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  expect(await screen.findByText("Epic Dragon Hunt")).toBeInTheDocument();
  expect(screen.getByText("RPG24000001")).toBeInTheDocument();
});

test("renders all key event attributes", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [
          makeEvent({
            gameId: "RPG24000001",
            title: "Epic Dragon Hunt",
            shortDescription: "Hunt the dragon",
            location: "ICC Hall A",
            gmNames: "Jane Doe",
            cost: 4,
          }),
        ],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("Epic Dragon Hunt");
  expect(screen.getByText("Hunt the dragon")).toBeInTheDocument();
  expect(screen.getByText("ICC Hall A")).toBeInTheDocument();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("$4.00")).toBeInTheDocument();
});

test("shows not-found message when event does not exist", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [],
        meta: { total: 0 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("DOESNOTEXIST");
  expect(await screen.findByText("EVENT NOT FOUND")).toBeInTheDocument();
});

test("fetches using the provided gameId as a query param", async () => {
  let capturedUrl: string | undefined;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = request.url;
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "BGM24000099" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("BGM24000099");
  await screen.findAllByRole("term");
  expect(capturedUrl).toContain("gameId=BGM24000099");
});

test("renders THE EVENT section heading", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("Epic Dragon Hunt");
  expect(
    screen.getByRole("heading", { name: "THE EVENT" }),
  ).toBeInTheDocument();
});

test("renders PLAYERS section heading", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByRole("heading", { name: "THE EVENT" });
  expect(screen.getByRole("heading", { name: "PLAYERS" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "LOGISTICS" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "CONTACT" })).toBeInTheDocument();
});
