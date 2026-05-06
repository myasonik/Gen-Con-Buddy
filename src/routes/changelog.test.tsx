import { StrictMode } from "react";
import { expect, test, beforeEach } from "vitest";

const { captureFn } = vi.hoisted(() => ({ captureFn: vi.fn<() => void>() }));
vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: unknown }): unknown => children,
  usePostHog: (): { capture: typeof captureFn } => ({ capture: captureFn }),
}));
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
import { routeTree } from "../routeTree.gen";
import { parseSearch, stringifySearch } from "../lib/searchSerializer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../test/msw/server";
import { makeChangelogSummary, makeChangelogEntry, makeEvent } from "../test/msw/factory";
import type { ListChangelogsResponse, FetchChangelogResponse, EventSearchResponse } from "../utils/types";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";
import { renderRoute } from "../test/renderRoute";

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
  await expect(screen.findByText(/3 created/)).resolves.toBeInTheDocument();
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
  await expect(screen.findByText("No changelog entries yet.")).resolves.toBeInTheDocument();
});

test("shows error state when list fetch fails", async () => {
  server.use(http.get("/api/changelog/list", () => new HttpResponse(null, { status: 500 })));
  await renderChangelogPage();
  await expect(screen.findByText(/could not load changelog/i)).resolves.toBeInTheDocument();
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
  await expect(screen.findAllByText("Dragon Hunt")).resolves.not.toHaveLength(0);
});

test("shows entry error message when entry fetch fails", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary({ id: "entry-1" })],
      }),
    ),
    http.get("/api/changelog/fetch", () => new HttpResponse(null, { status: 500 })),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/2 created/));
  await expect(screen.findByText(/could not load this entry/i)).resolves.toBeInTheDocument();
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
  await screen.findAllByText("Dragon Hunt");
  const createdEl = screen.getByText("Created");
  expect(createdEl.closest("summary")).toHaveTextContent("(1)");
  expect(screen.queryByText("Updated")).not.toBeInTheDocument();
  expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
});

test("changelog_entry_opened fires with entry id when an entry is expanded", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary({ id: "entry-1", createdCount: 1 })],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: "entry-1", createdEvents: [makeEvent()] }),
      }),
    ),
  );
  await renderChangelogPage();
  captureFn.mockClear();
  await user.click(await screen.findByText(/1 created/));
  expect(captureFn).toHaveBeenCalledWith("changelog_entry_opened", { entry_id: "entry-1" });
});

test("URL-opened entry is pre-fetched by the route loader before component renders", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 0, deletedCount: 0 }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const history = createMemoryHistory({ initialEntries: ["/changelog?open=1"] });
  const router = createRouter({
    routeTree,
    history,
    parseSearch,
    stringifySearch,
    context: { queryClient: client },
  });
  // router.load() runs the route loader; if the loader pre-fetches, the cache is populated
  // before any component renders — check that directly rather than relying on rendered output.
  await router.load();
  expect(client.getQueryData(["changelog", "entry", "entry-1"])).toBeDefined();
});

test("changelog row is expanded on load when its 1-based position is in the open param", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 0, deletedCount: 0 }),
          makeChangelogSummary({ id: "entry-2", createdCount: 1, updatedCount: 0, deletedCount: 0 }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", ({ request }) => {
      const id = new URL(request.url).searchParams.get("id");
      const title = id === "entry-2" ? "Dragon Hunt" : "Boring Event";
      return HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({ id: id ?? "entry-1", createdEvents: [makeEvent({ title })] }),
      });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRoute("/changelog?open=2", { queryClient: client });
  // entry-2's query only fires when isOpen=true; Dragon Hunt only appears if it does
  expect(await screen.findAllByText("Dragon Hunt")).not.toHaveLength(0);
});

test("opening a row adds its 1-based position to the open URL param", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 3, updatedCount: 0, deletedCount: 0 }),
          makeChangelogSummary({ id: "entry-2", createdCount: 5, updatedCount: 0, deletedCount: 0 }),
        ],
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog", { queryClient: client });
  const user = userEvent.setup();
  await user.click(await screen.findByText(/5 created/));
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("open")).toContain("2");
});

test("closing a row removes its position from the open URL param", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 7, updatedCount: 0, deletedCount: 0 }),
        ],
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1", { queryClient: client });
  const user = userEvent.setup();
  // Click to close (animation plays, details stays open until transitionend)
  await user.click(await screen.findByText(/7 created/));
  // jsdom doesn't fire transitionend; dispatch it to complete the close animation.
  // jsdom also doesn't fire toggle when details.open is set programmatically (after finish()),
  // so dispatch toggle manually to trigger onToggle → syncOpenToUrl.
  await act(async () => {
    const openDetails = document.querySelector("details[open]");
    openDetails
      ?.querySelector("[data-animated-content]")
      ?.dispatchEvent(new Event("transitionend"));
    openDetails?.dispatchEvent(new Event("toggle"));
  });
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("open")).not.toContain("1");
});

test("sub-group is expanded on load when its name is in the open param", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 1, deletedCount: 0 }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
          updatedEvents: [makeEvent({ title: "Boring Event" })],
          deletedEvents: [],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRoute("/changelog?open=1.created", { queryClient: client });
  const createdHeader = await screen.findByText("Created");
  const updatedHeader = screen.getByText("Updated");
  expect(createdHeader.closest("details")).toHaveAttribute("open");
  expect(updatedHeader.closest("details")).not.toHaveAttribute("open");
});

test("opening a sub-group adds its name to the entry's open param segment", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 1, deletedCount: 0 }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
          updatedEvents: [makeEvent({ title: "Boring Event" })],
          deletedEvents: [],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Start with entry open but no sub-groups specified
  const { router } = await renderRoute("/changelog?open=1", { queryClient: client });
  const user = userEvent.setup();
  // Click the Updated sub-group to open it
  await user.click(await screen.findByText("Updated"));
  const openValues = new URLSearchParams(router.state.location.search).getAll("open");
  expect(openValues).toContain("1.updated");
});

test("closing a sub-group removes its name from the entry's open param segment", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 0, deletedCount: 0 }),
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created", { queryClient: client });
  const user = userEvent.setup();
  await user.click(await screen.findByText("Created"));
  await act(async () => {
    const openDetails = document
      .querySelectorAll("details[open]")[1]; // inner group details (index 0 is the row)
    openDetails?.querySelector("[data-animated-content]")?.dispatchEvent(new Event("transitionend"));
    openDetails?.dispatchEvent(new Event("toggle"));
  });
  const openValues = new URLSearchParams(router.state.location.search).getAll("open");
  // The entry is still open (position 1), but created sub-group is gone
  expect(openValues.some((v) => v === "1" || v.startsWith("1."))).toBe(true);
  expect(openValues).not.toContain("1.created");
});

test("closing an entry removes all sub-group state from the URL", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 0, deletedCount: 0 }),
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created", { queryClient: client });
  const user = userEvent.setup();
  await screen.findAllByText("Dragon Hunt");
  // Click the row summary to close the entry (the row details is the first open details in DOM)
  await user.click(screen.getByText(/1 created/));
  await act(async () => {
    const rowDetails = document.querySelector("details[open]");
    rowDetails?.querySelector("[data-animated-content]")?.dispatchEvent(new Event("transitionend"));
    rowDetails?.dispatchEvent(new Event("toggle"));
  });
  const openValues = new URLSearchParams(router.state.location.search).getAll("open");
  expect(openValues).toHaveLength(0);
});

test("event links in changelog carry from:changelog navigation state", async () => {
  const eventGameId = "RPG24000099";
  const event = makeEvent({ gameId: eventGameId, title: "Dragon Hunt" });
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({ id: "entry-1", createdCount: 1, updatedCount: 0, deletedCount: 0 }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [event],
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
    http.get("/api/events/search", () =>
      HttpResponse.json<EventSearchResponse>({
        data: [event],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRoute("/changelog?open=1", { queryClient: client });
  const user = userEvent.setup();
  await user.click(await screen.findByRole("link", { name: "Dragon Hunt" }));
  expect(await screen.findByRole("button", { name: /back to changelog/i })).toBeInTheDocument();
});
