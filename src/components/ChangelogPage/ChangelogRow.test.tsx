import { StrictMode } from "react";
import { vi, expect, test, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../test/msw/server";
import { makeChangelogSummary, makeChangelogEntry, makeEvent } from "../../test/msw/factory";
import type { FetchChangelogResponse } from "../../utils/types";
import { ChangelogRow } from "./ChangelogRow";
import type { SharedColumnState } from "../EventTable/types";

const stubColumnState: SharedColumnState = {
  visibility: {},
  toggleVisibility: () => {},
  resetVisibility: () => {},
  sizing: {},
  setSizing: () => {},
  resetSizing: () => {},
  typeDisplay: "name",
  setTypeDisplay: () => {},
  showTypeIcon: true,
  setShowTypeIcon: () => {},
  resetTypeDisplay: () => {},
  dayFormat: "day",
  setDayFormat: () => {},
  resetDayFormat: () => {},
};

beforeEach(() => {
  localStorage.clear();
});

function renderRow(
  summary = makeChangelogSummary({ id: "entry-1" }),
  onOpen = vi.fn<() => void>(),
): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => (
      <ChangelogRow summary={summary} onOpen={onOpen} sharedColumnState={stubColumnState} />
    ),
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

test("renders summary counts", async () => {
  renderRow(makeChangelogSummary({ createdCount: 3, updatedCount: 1, deletedCount: 2 }));
  await expect(screen.findByText("3 created")).resolves.toBeInTheDocument();
  expect(screen.getByText("1 updated")).toBeInTheDocument();
  expect(screen.getByText("2 deleted")).toBeInTheDocument();
});

test("does not fetch entry data while row is closed", async () => {
  let fetchCalled = false;
  server.use(
    http.get("/api/changelog/fetch", () => {
      fetchCalled = true;
      return HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: "entry-1" }),
      });
    }),
  );
  renderRow();
  // Allow any pending microtasks to settle
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(fetchCalled).toBe(false);
});

test("fetches entry and shows content when opened", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      }),
    ),
  );
  renderRow();
  await user.click(await screen.findByText(/created/));
  await expect(screen.findAllByText("Dragon Hunt")).resolves.not.toHaveLength(0);
});

test("calls onOpen when row is expanded", async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn<() => void>();
  server.use(
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: "entry-1" }),
      }),
    ),
  );
  renderRow(makeChangelogSummary({ id: "entry-1" }), onOpen);
  await user.click(await screen.findByText(/created/));
  expect(onOpen).toHaveBeenCalledTimes(1);
});

test("shows error message when entry fetch fails", async () => {
  const user = userEvent.setup();
  server.use(http.get("/api/changelog/fetch", () => new HttpResponse(null, { status: 500 })));
  renderRow();
  await user.click(await screen.findByText(/created/));
  await expect(screen.findByText(/could not load this entry/i)).resolves.toBeInTheDocument();
});
