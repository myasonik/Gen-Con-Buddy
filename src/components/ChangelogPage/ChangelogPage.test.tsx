import { StrictMode } from "react";
import { expect, test, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../test/msw/server";
import { makeChangelogSummary, makeChangelogEntry, makeEvent } from "../../test/msw/factory";
import type { ListChangelogsResponse, FetchChangelogResponse } from "../../utils/types";
import { ChangelogPage } from "./ChangelogPage";

beforeEach(() => {
  localStorage.clear();
});

async function renderChangelogPage(): Promise<void> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const changelogRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/changelog",
    component: ChangelogPage,
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([changelogRoute, eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/changelog"] }),
  });
  await act(async () => {
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    );
  });
}

test("prefetches the first entry on mount", async () => {
  let entryFetchCount = 0;
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary({ id: "entry-1" })],
      }),
    ),
    http.get("/api/changelog/fetch", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("id") === "entry-1") {
        entryFetchCount++;
      }
      return HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: "entry-1" }),
      });
    }),
  );
  await renderChangelogPage();
  await waitFor(() => expect(entryFetchCount).toBeGreaterThanOrEqual(1));
});

test("opening a row shows data immediately from cache without a loading flash", async () => {
  const user = userEvent.setup();
  // Use staleTime: Infinity so prefetched data is never considered stale —
  // this makes background-refetch behavior unambiguous and proves the prefetch worked.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  let entryFetchCount = 0;
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () => {
      entryFetchCount++;
      return HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      });
    }),
  );
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const changelogRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/changelog",
    component: ChangelogPage,
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([changelogRoute, eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/changelog"] }),
  });
  await act(async () => {
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    );
  });

  // Wait for the prefetch to complete
  await waitFor(() => expect(entryFetchCount).toBeGreaterThanOrEqual(1));
  const countAfterPrefetch = entryFetchCount;

  // Open the row — staleTime: Infinity means no background refetch; count stays the same
  await user.click(await screen.findByText(/1 created/));
  await screen.findAllByText("Dragon Hunt");
  expect(entryFetchCount).toBe(countAfterPrefetch);
});

test("opening row[0] prefetches entry for row[1]", async () => {
  const user = userEvent.setup();
  let entry2FetchCount = 0;
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
          makeChangelogSummary({
            id: "entry-2",
            createdCount: 2,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("id") === "entry-2") {
        entry2FetchCount++;
      }
      return HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: url.searchParams.get("id") ?? "entry-1" }),
      });
    }),
  );
  await renderChangelogPage();
  // Wait for the initial list to load
  await screen.findByText(/1 created/);

  // Open row 0 — should trigger prefetch of entry-2
  await user.click(screen.getAllByText(/created/)[0]);
  await waitFor(() => expect(entry2FetchCount).toBeGreaterThanOrEqual(1));
});

test("renders Visibility and Format buttons above the changelog entries", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary()],
      }),
    ),
  );
  await renderChangelogPage();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
  });
});
