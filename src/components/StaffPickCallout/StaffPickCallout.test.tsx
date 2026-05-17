import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, beforeEach } from "vitest";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { makeEvent } from "../../test/msw/factory";
import { makeStaffPickHandler } from "../../test/msw/handlers";
import { StaffPickCallout } from "./StaffPickCallout";
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";

beforeEach(() => {
  localStorage.clear();
});

function renderCallout(): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => <StaffPickCallout />,
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

test("renders nothing while fetching", async () => {
  renderCallout();
  expect(screen.queryByText("Looks like that quest hit a dead end.")).not.toBeInTheDocument();
});

test("renders preamble copy when events load", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeStaffPickHandler(events));
  renderCallout();
  await screen.findByText("Looks like that quest hit a dead end.");
  expect(screen.getByText(/If you're still looking for your next adventure/)).toBeInTheDocument();
});

test("renders panel controls when events load", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeStaffPickHandler(events));
  renderCallout();
  await screen.findByText("Looks like that quest hit a dead end.");
  expect(screen.getByRole("button", { name: /visibility/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /format/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /sort/i })).toBeNull();
});

test("renders a row for each fetched event", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeStaffPickHandler(events));
  renderCallout();
  await screen.findByText("Looks like that quest hit a dead end.");
  const rows = screen.getAllByRole("row");
  // 1 header row + 7 data rows
  expect(rows).toHaveLength(8);
});

test("renders nothing when fetch returns 0 events", async () => {
  server.use(makeStaffPickHandler([]));
  renderCallout();
  await waitFor(() => {
    expect(screen.queryByText("Looks like that quest hit a dead end.")).not.toBeInTheDocument();
  });
});

test("renders nothing when fetch errors", async () => {
  server.use(http.get("/api/events/search", () => HttpResponse.error()));
  renderCallout();
  await waitFor(() => {
    expect(screen.queryByText("Looks like that quest hit a dead end.")).not.toBeInTheDocument();
  });
});
