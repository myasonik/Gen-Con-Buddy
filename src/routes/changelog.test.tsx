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
import type {
  ListChangelogsResponse,
  FetchChangelogResponse,
  EventSearchResponse,
} from "../utils/types";
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRoute("/changelog", { queryClient: client });
  await user.click(await screen.findByText(/1 created/));
  await user.click(await screen.findByText("Created"));
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
  const createdEl = await screen.findByText("Created");
  expect(createdEl.closest("button")).toHaveTextContent("1");
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
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
          makeChangelogSummary({
            id: "entry-2",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
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
  await renderRoute("/changelog?open=2.created", { queryClient: client });
  // entry-2's query only fires when isOpen=true; Dragon Hunt only appears if it does
  await expect(screen.findAllByText("Dragon Hunt")).resolves.not.toHaveLength(0);
});

test("opening a row adds its 1-based position to the open URL param", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 3,
            updatedCount: 0,
            deletedCount: 0,
          }),
          makeChangelogSummary({
            id: "entry-2",
            createdCount: 5,
            updatedCount: 0,
            deletedCount: 0,
          }),
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
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 7,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1", { queryClient: client });
  const user = userEvent.setup();
  await user.click(await screen.findByText(/7 created/));
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("open")).not.toContain("1");
});

test("sub-group is expanded on load when its name is in the open param", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 1,
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
  expect(createdHeader.closest("button")).toHaveAttribute("aria-expanded", "true");
  expect(updatedHeader.closest("button")).toHaveAttribute("aria-expanded", "false");
});

test("opening a sub-group adds its name to the entry's open param segment", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 1,
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created", { queryClient: client });
  const user = userEvent.setup();
  await user.click(await screen.findByText("Created"));
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created", { queryClient: client });
  const user = userEvent.setup();
  await screen.findAllByText("Dragon Hunt");
  // Click the row summary to close the entry (the row details is the first open details in DOM)
  await user.click(screen.getByText(/1 created/));
  const openValues = new URLSearchParams(router.state.location.search).getAll("open");
  expect(openValues).toHaveLength(0);
});

test("validateSearch round-trips sort embedded in open param", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const history = createMemoryHistory({
    initialEntries: ["/changelog?open=1.created.title.asc"],
  });
  const router = createRouter({
    routeTree,
    history,
    parseSearch,
    stringifySearch,
    context: { queryClient: client },
  });
  await router.load();
  const search = router.state.location.search as { open?: string[] };
  expect(search.open).toContain("1.created.title.asc");
});

// ── validateSearch filter params ───────────────────────────────────────────

function makeRouter(url: string): ReturnType<typeof createRouter> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
    parseSearch,
    stringifySearch,
    context: { queryClient: client },
  });
}

function getChangelogSearch(router: ReturnType<typeof createRouter>): Record<string, unknown> {
  // router.state.matches contains validated search (post-validateSearch);
  // the changelog route is the last match when on /changelog
  const { matches } = router.state;
  return ((matches[matches.length - 1] as { search?: unknown })?.search ?? {}) as Record<
    string,
    unknown
  >;
}

test("validateSearch returns undefined for absent filter params", async () => {
  const router = makeRouter("/changelog");
  await router.load();
  const search = getChangelogSearch(router);
  expect(search.eventType).toBeUndefined();
  expect(search.days).toBeUndefined();
  expect(search.timeStart).toBeUndefined();
  expect(search.timeEnd).toBeUndefined();
});

test("validateSearch returns undefined for empty-string filter params", async () => {
  const router = makeRouter("/changelog?eventType=&days=");
  await router.load();
  const search = getChangelogSearch(router);
  expect(search.eventType).toBeUndefined();
  expect(search.days).toBeUndefined();
});

test("validateSearch returns string value for present filter params", async () => {
  const router = makeRouter("/changelog?eventType=RPG&days=thu&timeStart=09%3A00&timeEnd=17%3A00");
  await router.load();
  const search = getChangelogSearch(router);
  expect(search.eventType).toBe("RPG");
  expect(search.days).toBe("thu");
  expect(search.timeStart).toBe("09:00");
  expect(search.timeEnd).toBe("17:00");
});

test("undefined filter params are not serialized to URL when navigating", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ entries: [] }),
    ),
  );
  const { router } = await renderRoute("/changelog?days=thu");
  // Simulate the Search form being reset (all values cleared → navigate with undefined)
  await act(async () => {
    await router.navigate({
      to: "/changelog",
      search: {
        open: [],
        eventType: undefined,
        days: undefined,
        timeStart: undefined,
        timeEnd: undefined,
      },
    });
  });
  const { href } = router.state.location;
  expect(href).not.toMatch(/[?&](eventType|days|timeStart|timeEnd)=/);
});

test("clicking a column header in a changelog group writes sort to URL", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 2,
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
          createdEvents: [makeEvent({ title: "Zebra" }), makeEvent({ title: "Apple" })],
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created", { queryClient: client });
  const user = userEvent.setup();
  const titleHeader = await screen.findByRole("columnheader", { name: /title/i });
  const sortButton = titleHeader.querySelector("button");
  if (!sortButton) {
    throw new Error("sort button not found in title header");
  }
  await user.click(sortButton);
  const openValues = new URLSearchParams(router.state.location.search).getAll("open");
  expect(openValues.some((v) => v.startsWith("1.created.title."))).toBe(true);
});

test("sort param pre-sorts created events on mount", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 2,
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
          createdEvents: [makeEvent({ title: "Zebra" }), makeEvent({ title: "Apple" })],
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await renderRoute("/changelog?open=1.created.title.asc", { queryClient: client });
  const rows = await screen.findAllByRole("row");
  const titles = rows
    .slice(1)
    .map((r) => r.querySelector("a")?.textContent)
    .filter(Boolean);
  expect(titles[0]).toBe("Apple");
  expect(titles[1]).toBe("Zebra");
});

test("closing a sub-group clears its sort from the URL", async () => {
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created.title.asc", {
    queryClient: client,
  });
  const user = userEvent.setup();
  await user.click(await screen.findByText("Created"));
  const openValues = new URLSearchParams(router.state.location.search).getAll("open");
  expect(openValues).not.toContain("1.created.title.asc");
});

test("event links in changelog carry from:changelog navigation state", async () => {
  const eventGameId = "RPG24000099";
  const event = makeEvent({ gameId: eventGameId, title: "Dragon Hunt" });
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
  await renderRoute("/changelog?open=1.created", { queryClient: client });
  const user = userEvent.setup();
  await user.click(await screen.findByRole("link", { name: "Dragon Hunt" }));
  await expect(
    screen.findByRole("button", { name: /back to changelog/i }),
  ).resolves.toBeInTheDocument();
});

test("sets document.title to 'Changelog | Gen Con Buddy'", async () => {
  const { queryClient: client } = await import("../lib/queryClient");
  await renderRoute("/changelog", { queryClient: client });
  expect(document.title).toBe("Changelog | Gen Con Buddy");
});

test("sets og:title meta to 'Changelog | Gen Con Buddy'", async () => {
  const { queryClient: client } = await import("../lib/queryClient");
  await renderRoute("/changelog", { queryClient: client });
  expect(
    document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
  ).toBe("Changelog | Gen Con Buddy");
});
