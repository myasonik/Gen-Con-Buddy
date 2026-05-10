import { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, beforeEach } from "vitest";
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
import { SearchResults } from "./SearchResults";
import type { EventSearchResponse, SortState } from "../../utils/types";
import type { SearchParams } from "../../utils/searchParamSchema";
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";
import { __reset } from "../../lib/announce";

function setupLiveRegions(): () => void {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  polite.setAttribute("aria-live", "polite");
  document.body.appendChild(polite);

  const assertive = document.createElement("div");
  assertive.id = "live-assertive";
  assertive.setAttribute("aria-live", "assertive");
  document.body.appendChild(assertive);

  return () => {
    polite.remove();
    assertive.remove();
  };
}

beforeEach(() => {
  localStorage.clear();
  __reset();
  vi.restoreAllMocks();
});

function renderSearchResults(
  searchParams: SearchParams = {},
  onNavigate = vi.fn<(page: number, limit: number) => void>(),
  onSort = vi.fn<(sorts: SortState[]) => void>(),
): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => (
      <SearchResults searchParams={searchParams} onNavigate={onNavigate} onSort={onSort} />
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

test("shows loading state while fetching", async () => {
  renderSearchResults();
  await expect(screen.findByText("LOADING QUESTS...")).resolves.toBeInTheDocument();
});

test("renders a table row for each event", async () => {
  renderSearchResults();
  const rows = await screen.findAllByRole("row");
  // 1 header row + 20 data rows (default handler pool has 20 events)
  expect(rows).toHaveLength(21);
});

test("renders empty state when no events are returned", async () => {
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
  renderSearchResults();
  await expect(screen.findByText("NO QUESTS FOUND")).resolves.toBeInTheDocument();
});

test("renders empty state when API omits data field from response", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({ meta: { total: 0 }, links: { self: "" }, error: null }),
    ),
  );
  renderSearchResults();
  await expect(screen.findByText("NO QUESTS FOUND")).resolves.toBeInTheDocument();
});

test("title column is visible by default and shows event title", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "My Favorite RPG" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  await expect(screen.findByRole("columnheader", { name: "Title" })).resolves.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "My Favorite RPG" })).toBeInTheDocument();
});

test("gameId column is hidden by default", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.queryByRole("columnheader", { name: "Game ID" })).not.toBeInTheDocument();
});

test("toggling a column off hides its header", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("checkbox", { name: "Title" }));
  await user.click(screen.getByRole("button", { name: "Close" }));

  expect(screen.queryByRole("columnheader", { name: "Title" })).not.toBeInTheDocument();
});

test("event title link points to the event detail route", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000042", title: "Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  const link = await screen.findByRole("link", { name: "Dragon Hunt" });
  expect(link).toHaveAttribute("href", "/event/RPG24000042");
});

test("reset button restores default column visibility", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  // open Visibility drawer, toggle gameId on, close drawer, verify column appears
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("checkbox", { name: "Game ID" }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.getByRole("columnheader", { name: "Game ID" })).toBeInTheDocument();

  // reopen drawer, click Reset — gameId should disappear again
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("columnheader", { name: "Game ID" })).not.toBeInTheDocument();

  // title (default-visible) should still be present
  expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
});

test("materialsRequired column is hidden by default", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(
    screen.queryByRole("columnheader", { name: "Materials Required" }),
  ).not.toBeInTheDocument();
});

test("materialsRequiredDetails column is hidden by default", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(
    screen.queryByRole("columnheader", { name: "Materials Required Details" }),
  ).not.toBeInTheDocument();
});

test("sends page as 0-indexed when page > 1", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ page: 2 });
  await screen.findAllByRole("row");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get("page")).toBe("1");
});

test("omits page param when page is 1", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ page: 1 });
  await screen.findAllByRole("row");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.has("page")).toBe(false);
});

test("omits limit param when limit is 100", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ limit: 100 });
  await screen.findAllByRole("row");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.has("limit")).toBe(false);
});

test("sends limit param when limit is not 100", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ limit: 500 });
  await screen.findAllByRole("row");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get("limit")).toBe("500");
});

test("renders pagination when results are present", async () => {
  renderSearchResults();
  const topNav = await screen.findByRole("navigation", { name: "Pagination, top" });
  expect(topNav).toBeInTheDocument();
});

test("renders pagination above and below the table", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const topNav = screen.getByRole("navigation", { name: "Pagination, top" });
  const bottomNav = screen.getByRole("navigation", { name: "Pagination, bottom" });
  expect(topNav).toBeInTheDocument();
  expect(bottomNav).toBeInTheDocument();
});

test("does not render pagination when no events found", async () => {
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
  renderSearchResults();
  await screen.findByText("NO QUESTS FOUND");
  expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
});

test("calls onNavigate when Next is clicked", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn<(page: number, limit: number) => void>();
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ page: 1 }, onNavigate);
  // wait for both pagination navs to render
  await screen.findByRole("navigation", { name: "Pagination, top" });
  await user.click(screen.getAllByRole("button", { name: "Next" })[0]);
  expect(onNavigate).toHaveBeenCalledWith(2, 100);
});

test("sends sort param to API when provided in searchParams", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ sort: "startDateTime.asc" });
  await screen.findAllByRole("row");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get("sort")).toBe("startDateTime.asc");
});

test("omits sort param from API when not in searchParams", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({});
  await screen.findAllByRole("row");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.has("sort")).toBe(false);
});

test('unsorted sortable column has aria-sort="none"', async () => {
  renderSearchResults({});
  const th = await screen.findByRole("columnheader", { name: "Title" });
  expect(th).toHaveAttribute("aria-sort", "none");
});

test('active ascending column has aria-sort="ascending"', async () => {
  renderSearchResults({ sort: "title.asc" });
  const th = await screen.findByRole("columnheader", { name: "Title" });
  expect(th).toHaveAttribute("aria-sort", "ascending");
});

test('active descending column has aria-sort="descending"', async () => {
  renderSearchResults({ sort: "title.desc" });
  const th = await screen.findByRole("columnheader", { name: "Title" });
  expect(th).toHaveAttribute("aria-sort", "descending");
});

test("clicking unsorted column calls onSort with field.asc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderSearchResults({}, vi.fn<(page: number, limit: number) => void>(), onSort);
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Title" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "asc" }]);
});

test("clicking ascending column calls onSort with field.desc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderSearchResults(
    { sort: "title.asc" },
    vi.fn<(page: number, limit: number) => void>(),
    onSort,
  );
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Title" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
});

test("clicking descending column calls onSort with empty array (clears sort)", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderSearchResults(
    { sort: "title.desc" },
    vi.fn<(page: number, limit: number) => void>(),
    onSort,
  );
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Title" }));
  expect(onSort).toHaveBeenCalledWith([]);
});

test('day column has aria-sort="ascending" when sorted by startDateTime ascending', async () => {
  renderSearchResults({ sort: "startDateTime.asc" });
  const th = await screen.findByRole("columnheader", { name: "Day" });
  expect(th).toHaveAttribute("aria-sort", "ascending");
});

test('announces "Added Title to sort, ascending" when clicking unsorted column', async () => {
  const user = userEvent.setup();
  const cleanup = setupLiveRegions();
  renderSearchResults(
    {},
    vi.fn<(page: number, limit: number) => void>(),
    vi.fn<(sorts: SortState[]) => void>(),
  );
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Title" }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe(
      "Added Title to sort, ascending",
    );
  });
  cleanup();
});

test('announces "Title sorted descending" when clicking ascending column', async () => {
  const user = userEvent.setup();
  const cleanup = setupLiveRegions();
  renderSearchResults(
    { sort: "title.asc" },
    vi.fn<(page: number, limit: number) => void>(),
    vi.fn<(sorts: SortState[]) => void>(),
  );
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Title" }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Title sorted descending");
  });
  cleanup();
});

test('announces "Title removed from sort" when clicking descending column', async () => {
  const user = userEvent.setup();
  const cleanup = setupLiveRegions();
  renderSearchResults(
    { sort: "title.desc" },
    vi.fn<(page: number, limit: number) => void>(),
    vi.fn<(sorts: SortState[]) => void>(),
  );
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Title" }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Title removed from sort");
  });
  cleanup();
});

test("resize handle is rendered on resizable columns", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const handles = screen.getAllByTestId(/^resize-handle-/);
  expect(handles.length).toBeGreaterThan(0);
});

test("each visible column header has a resize handle", async () => {
  renderSearchResults();
  const headers = await screen.findAllByRole("columnheader");
  const handles = screen.getAllByTestId(/^resize-handle-/);
  expect(handles).toHaveLength(headers.length);
});

test("pre-seeded localStorage sizing is applied to column width on mount", async () => {
  localStorage.setItem("gcb-column-sizing", JSON.stringify({ version: 1, value: { title: 300 } }));
  renderSearchResults();
  await screen.findAllByRole("row");
  const titleTh = screen.getByRole("columnheader", { name: "Title" });
  expect(titleTh).toHaveStyle({ width: "300px" });
});

test("reset to defaults clears column sizing from localStorage", async () => {
  const user = userEvent.setup();
  localStorage.setItem("gcb-column-sizing", JSON.stringify({ version: 1, value: { title: 300 } }));
  renderSearchResults();
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));

  expect(localStorage.getItem("gcb-column-sizing")).toBeNull();
});

test("actions button is present on resizable columns", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const actionButtons = screen.getAllByRole("button", {
    name: "Column actions",
  });
  expect(actionButtons.length).toBeGreaterThan(0);
});

test("renders error state when API returns HTTP 500", async () => {
  server.use(http.get("/api/events/search", () => new HttpResponse(null, { status: 500 })));
  renderSearchResults();
  await expect(screen.findByText("QUEST FAILED")).resolves.toBeInTheDocument();
  expect(screen.getByText("Unable to load events. Please try again.")).toBeInTheDocument();
});

test("clicking Resize… on a column opens the resize dialog", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  const titleTh = screen.getByRole("columnheader", { name: "Title" });
  await user.click(within(titleTh).getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("submitting resize dialog updates column width in localStorage", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  const titleTh = screen.getByRole("columnheader", { name: "Title" });
  await user.click(within(titleTh).getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "400");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  const stored = JSON.parse(localStorage.getItem("gcb-column-sizing") ?? "{}");
  expect(stored).toStrictEqual({ version: 1, value: { title: 400 } });
});

test("eventType cell renders code and name when typeDisplay is both", async () => {
  localStorage.setItem(
    "gcb-type-display",
    JSON.stringify({ version: 3, value: { textMode: "both", showIcon: true } }),
  );
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({
        data: [makeEvent({ eventType: "RPG - Roleplaying Game" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.getAllByText("RPG").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Roleplaying Game").length).toBeGreaterThan(0);
});

test("type cell shows only name when typeDisplay is name", async () => {
  localStorage.setItem(
    "gcb-type-display",
    JSON.stringify({ version: 3, value: { textMode: "name", showIcon: true } }),
  );
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({
        data: [makeEvent({ eventType: "RPG - Roleplaying Game" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  const { container } = renderSearchResults();
  await screen.findAllByRole("row");
  expect(container.querySelector('[class*="typeName"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeCode"]')).toBeNull();
});

test("type cell omits icon when showTypeIcon is false", async () => {
  localStorage.setItem(
    "gcb-type-display",
    JSON.stringify({ version: 3, value: { textMode: "name", showIcon: false } }),
  );
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({
        data: [makeEvent({ eventType: "RPG - Roleplaying Game" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  const { container } = renderSearchResults();
  await screen.findAllByRole("row");
  expect(container.querySelector('[class*="typeCell"] svg')).toBeNull();
});

test("EventTable section has no data-type-display attribute when typeDisplay is both", async () => {
  localStorage.setItem(
    "gcb-type-display",
    JSON.stringify({ version: 3, value: { textMode: "both", showIcon: true } }),
  );
  const { container } = renderSearchResults();
  await screen.findAllByRole("row");
  expect(container.querySelector('[data-type-display="code"]')).toBeNull();
  expect(container.querySelector('[data-type-display="name"]')).toBeNull();
});

test("type display radio buttons are present with Name checked by default", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("Show icon checkbox is present and checked by default", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("reset to defaults resets type display to name and icon shown", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "gcb-type-display",
    JSON.stringify({ version: 3, value: { textMode: "code", showIcon: false } }),
  );
  renderSearchResults();
  await screen.findAllByRole("row");
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("radio", { name: "Code" })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("renders EventListMobile on mobile viewport, not EventTable", async () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: query === "(width <= 60rem)",
        media: query,
        onchange: null,
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }) as unknown as MediaQueryList,
  );

  renderSearchResults();
  const items = await screen.findAllByRole("listitem");
  expect(items.length).toBeGreaterThan(0);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

test("renders EventTable on desktop viewport, not EventListMobile", async () => {
  renderSearchResults();
  await expect(screen.findByRole("table")).resolves.toBeInTheDocument();
});

test("controls bar renders Visibility, Format, and Sort buttons", async () => {
  server.use(
    http.get("*/api/events", () => HttpResponse.json({ data: [makeEvent()], meta: { total: 1 } })),
  );
  renderSearchResults();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
  });
});

test("shows StaffPickCallout when search returns no results", async () => {
  const staffPickEvents = WILDHAVENS_GAME_IDS.map((gameId) =>
    makeEvent({ gameId, title: `Staff Pick Game ${gameId}` }),
  );
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const response: EventSearchResponse = url.searchParams.has("gameId")
        ? {
            data: staffPickEvents,
            meta: { total: staffPickEvents.length },
            links: { self: "" },
            error: null,
          }
        : { data: [], meta: { total: 0 }, links: { self: "" }, error: null };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  await screen.findByText("NO QUESTS FOUND");
  await screen.findByText("Staff Picks");
});

test("does not show StaffPickCallout when search returns results", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.queryByText("Staff Picks")).not.toBeInTheDocument();
});
