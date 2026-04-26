import { act, render, screen } from "@testing-library/react";
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
import { server } from "../test/msw/server";
import {
  makeChangelogSummary,
  makeChangelogEntry,
  makeEvent,
} from "../test/msw/factory";
import type {
  ListChangelogsResponse,
  FetchChangelogResponse,
} from "../utils/types";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";

beforeEach(() => {
  localStorage.clear();
});

async function renderChangelogPage() {
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
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  });
}

test("renders a summary row for each changelog entry", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 3,
            updatedCount: 1,
            deletedCount: 0,
          }),
        ],
      }),
    ),
  );
  await renderChangelogPage();
  expect(await screen.findByText(/3 created/)).toBeInTheDocument();
  expect(screen.getByText(/1 updated/)).toBeInTheDocument();
  expect(screen.getByText(/0 deleted/)).toBeInTheDocument();
});

test("shows empty state when no entries returned", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ entries: [] }),
    ),
  );
  await renderChangelogPage();
  expect(
    await screen.findByText("No changelog entries yet."),
  ).toBeInTheDocument();
});

test("shows error state when list fetch fails", async () => {
  server.use(
    http.get(
      "/api/changelog/list",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  await renderChangelogPage();
  expect(
    await screen.findByText(/could not load changelog/i),
  ).toBeInTheDocument();
});

test("expanding a row fetches and displays the event table", async () => {
  const user = userEvent.setup();
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
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/1 created/));
  expect(await screen.findByText("Dragon Hunt")).toBeInTheDocument();
});

test("shows entry error message when entry fetch fails", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary({ id: "entry-1" })],
      }),
    ),
    http.get(
      "/api/changelog/fetch",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/2 created/));
  expect(
    await screen.findByText(/could not load this entry/i),
  ).toBeInTheDocument();
});

test("does not render section headers for empty event groups", async () => {
  const user = userEvent.setup();
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
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/1 created/));
  expect(await screen.findByText("Created (1)")).toBeInTheDocument();
  expect(screen.queryByText("Updated (0)")).not.toBeInTheDocument();
  expect(screen.queryByText("Deleted (0)")).not.toBeInTheDocument();
});
