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
import type { FetchChangelogResponse, SearchFormValues, ChangelogSummary } from "../../utils/types";
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

function renderRow({
  summary = makeChangelogSummary({ id: "entry-1" }),
  onOpen = vi.fn<() => void>(),
  activeFilter,
  client,
}: {
  summary?: ChangelogSummary;
  onOpen?: () => void;
  activeFilter?: SearchFormValues;
  client?: QueryClient;
} = {}): ReturnType<typeof render> {
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({
    component: () => (
      <ChangelogRow
        summary={summary}
        onOpen={onOpen}
        sharedColumnState={stubColumnState}
        activeFilter={activeFilter}
      />
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
  return render(
    <StrictMode>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

test("renders summary counts", async () => {
  renderRow({
    summary: makeChangelogSummary({ createdCount: 3, updatedCount: 1, deletedCount: 2 }),
  });
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
  // After opening the row, the entry fetches and ChangelogEntryPanel renders the sub-group trigger.
  // The trigger button contains the group label and count, confirming content was loaded.
  await expect(screen.findByText("Created")).resolves.toBeInTheDocument();
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
  renderRow({ summary: makeChangelogSummary({ id: "entry-1" }), onOpen });
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

test("shows unknown indicator when filter is active and entry not in cache", async () => {
  renderRow({ activeFilter: { eventType: "RPG" } });
  await expect(screen.findByLabelText("Filter match unknown")).resolves.toBeInTheDocument();
});

test("no unknown indicator when no filter is active", async () => {
  renderRow();
  await screen.findByText(/created/);
  expect(screen.queryByLabelText("Filter match unknown")).not.toBeInTheDocument();
});

test("dims row when cached entry has no events matching active filter", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" })],
      updatedEvents: [],
      deletedEvents: [],
    }),
  );
  const { container } = renderRow({
    summary: makeChangelogSummary({ id: "entry-1", createdCount: 1 }),
    activeFilter: { eventType: "BGM" },
    client,
  });
  await screen.findByText(/created/);
  expect(container.querySelector("[data-filter-state='dimmed']")).toBeInTheDocument();
});

test("shows filtered/total fraction when filter active and entry cached", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" }), makeEvent({ eventType: "BGM" })],
      updatedEvents: [
        makeEvent({ eventType: "RPG" }),
        makeEvent({ eventType: "RPG" }),
        makeEvent({ eventType: "BGM" }),
      ],
      deletedEvents: [],
    }),
  );
  renderRow({
    summary: makeChangelogSummary({
      id: "entry-1",
      createdCount: 2,
      updatedCount: 3,
      deletedCount: 0,
    }),
    activeFilter: { eventType: "RPG" },
    client,
  });
  await expect(screen.findByText("1/2 created")).resolves.toBeInTheDocument();
  expect(screen.getByText("2/3 updated")).toBeInTheDocument();
});

test("shows normal counts when no filter is active even if entry is cached", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" }), makeEvent({ eventType: "BGM" })],
      updatedEvents: [],
      deletedEvents: [],
    }),
  );
  renderRow({
    summary: makeChangelogSummary({ id: "entry-1", createdCount: 2 }),
    client,
    // no activeFilter
  });
  await expect(screen.findByText("2 created")).resolves.toBeInTheDocument();
});
