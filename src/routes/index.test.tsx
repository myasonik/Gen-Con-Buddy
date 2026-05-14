import { test, describe, expect, beforeEach } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw/server";
import { makeEvent } from "../test/msw/factory";
import type { EventSearchResponse } from "../utils/types";
import { renderRoute } from "../test/renderRoute";

const { captureFn } = vi.hoisted(() => ({ captureFn: vi.fn<() => void>() }));
vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: unknown }): unknown => children,
  usePostHog: (): { capture: typeof captureFn } => ({ capture: captureFn }),
}));

beforeEach(() => {
  captureFn.mockClear();
});

test("populates eventType dropdown from URL search param on load", async () => {
  await renderRoute("/", { searchParams: { eventType: "BGM" } });
  expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();
});

test("updates form when URL search params change after initial render", async () => {
  const { router } = await renderRoute("/?eventType=BGM");
  expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();

  await act(async () => {
    await router.navigate({ to: "/", search: { eventType: "RPG" } });
  });

  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove BGM" })).not.toBeInTheDocument();
});

test("submitting a new search resets page to 1", async () => {
  const user = userEvent.setup();
  let latestUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      latestUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/?page=3");
  await screen.findByRole("navigation", { name: "Pagination, top" });
  latestUrl = null;
  // Submit the search form (clicking Search button resets page)
  await user.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("navigation", { name: "Pagination, top" });
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.has("page")).toBe(false);
});

test("submitting a new search preserves the active sort", async () => {
  const user = userEvent.setup();
  let latestUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      latestUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/?sort=startDateTime.asc");
  await screen.findByRole("navigation", { name: "Pagination, top" });
  latestUrl = null;
  // Change a form field to trigger a search
  await user.type(screen.getByPlaceholderText("Search events…"), "dragon");
  await user.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("navigation", { name: "Pagination, top" });
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.get("sort")).toBe("startDateTime.asc");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.get("filter")).toBe("dragon");
});

test("loading with sort param in URL shows sort indicator on column header", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json<EventSearchResponse>({
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  await renderRoute("/?sort=startDateTime.asc");
  const startButton = await screen.findByRole("button", { name: "Start" });
  expect(startButton.closest("th")).toHaveAttribute("aria-sort", "ascending");
});

test("navigating to page 2 sends page=1 to API (0-indexed)", async () => {
  const user = userEvent.setup();
  let latestUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      latestUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/");
  // wait for initial render and pagination
  await screen.findByRole("navigation", { name: "Pagination, top" });
  latestUrl = null;
  // click Next on the first pagination nav
  const topNav = screen.getByRole("navigation", { name: "Pagination, top" });
  await user.click(within(topNav).getByRole("button", { name: "Next" }));
  // wait for re-render after navigation
  await screen.findByRole("navigation", { name: "Pagination, top" });
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.get("page")).toBe("1");
});

test("materialsRequiredDetails param survives route validator", async () => {
  const { router } = await renderRoute("/?materialsRequiredDetails=Dice+required");
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(router.state.resolvedLocation!.search.materialsRequiredDetails).toBe("Dice required");
});

test("clicking a sort column header updates the URL with sort param and resets page", async () => {
  const user = userEvent.setup();
  let latestUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      latestUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/?page=3");
  await screen.findByRole("navigation", { name: "Pagination, top" });
  latestUrl = null;
  await user.click(screen.getByRole("button", { name: "Start" }));
  await screen.findByRole("navigation", { name: "Pagination, top" });
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.has("page")).toBe(false);
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.get("sort")).toBe("startDateTime.asc");
});

test("renders a banner landmark with the app title", async () => {
  await renderRoute("/");
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("banner")).toHaveTextContent("Gen Con Buddy");
});

test("site header contains the app title", async () => {
  await renderRoute("/");
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByText("Gen Con Buddy")).toBeInTheDocument();
});

test("navigating back to page 1 omits page from URL and API call", async () => {
  const user = userEvent.setup();
  let latestUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      latestUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/?page=2");
  await screen.findByRole("navigation", { name: "Pagination, top" });
  latestUrl = null;
  const topNav = screen.getByRole("navigation", { name: "Pagination, top" });
  await user.click(within(topNav).getByRole("button", { name: "Previous" }));
  await screen.findByRole("navigation", { name: "Pagination, top" });
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.has("page")).toBe(false);
});

test("renders day toggles as a group in the filter strip", async () => {
  await renderRoute("/");
  expect(screen.getByRole("group", { name: "Days" })).toBeInTheDocument();
});

test("sets document.title to 'Gen Con Buddy'", async () => {
  await renderRoute("/");
  expect(document.title).toBe("Gen Con Buddy");
});

test("day tiles are checkboxes", async () => {
  await renderRoute("/");
  expect(screen.getByRole("checkbox", { name: "Wed" })).not.toBeChecked();
});

test("day checkboxes are keyboard accessible interactive elements", async () => {
  await renderRoute("/");
  const thuCheckbox = screen.getByRole("checkbox", { name: "Thu" });
  expect(thuCheckbox).toBeInTheDocument();
  expect(thuCheckbox).not.toBeChecked();
});

test("eventType column renders the event type", async () => {
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
  await renderRoute("/");
  const table = await screen.findByRole("table");
  expect(within(table).getByText("Roleplaying Game")).toBeInTheDocument();
});

describe("sidebar toggle and active filters", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sidebar toggle button is present in the results area", async () => {
    await renderRoute("/");
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
  });

  it("sidebar toggle button has aria-expanded=false by default", async () => {
    await renderRoute("/");
    expect(screen.getByRole("button", { name: /Filters/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("clicking toggle button flips aria-expanded to true", async () => {
    const user = userEvent.setup();
    await renderRoute("/");
    const btn = screen.getByRole("button", { name: /Filters/ });
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking the backdrop closes the drawer", async () => {
    const user = userEvent.setup();
    await renderRoute("/");
    const btn = screen.getByRole("button", { name: /Filters/ });
    // Open the drawer first
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    // Find the backdrop by data-testid — aria-hidden, not in a11y tree
    const backdrop = document.querySelector("[data-testid='drawer-backdrop']") as HTMLElement;
    await user.click(backdrop);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("no active filter chips when no filters are set", async () => {
    await renderRoute("/");
    expect(screen.queryByRole("button", { name: /Search:/ })).toBeNull();
  });

  it("active filter chip appears when filter param is in URL", async () => {
    await renderRoute("/?filter=dragon");
    expect(screen.getByRole("button", { name: /Search: dragon/ })).toBeInTheDocument();
  });

  it("clicking a filter chip removes it from the URL", async () => {
    const user = userEvent.setup();
    const { router } = await renderRoute("/?filter=dragon&location=Hall+A");
    expect(screen.getByRole("button", { name: /Remove Search: dragon/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Remove Search: dragon/ }));
    expect(router.state.location.searchStr).not.toContain("filter=");
    expect(router.state.location.searchStr).toContain("location=");
  });

  it("days filter produces one chip per day", async () => {
    await renderRoute("/?days=fri%2Csat");
    const bar = screen.getByRole("list", { name: "Active filters" });
    expect(within(bar).getByText("Fri")).toBeInTheDocument();
    expect(within(bar).getByText("Sat")).toBeInTheDocument();
    expect(within(bar).queryByRole("button", { name: /Days:/ })).toBeNull();
  });

  it("clicking Fri chip removes fri but leaves sat in URL", async () => {
    const user = userEvent.setup();
    const { router } = await renderRoute("/?days=fri%2Csat");
    const bar = screen.getByRole("list", { name: "Active filters" });
    await user.click(within(bar).getByRole("button", { name: "Remove Fri" }));
    expect(router.state.location.searchStr).toContain("days=sat");
    expect(router.state.location.searchStr).not.toContain("fri");
  });

  it("eventType filter produces one chip per code", async () => {
    await renderRoute("/?eventType=RPG%2CBGM");
    const bar = screen.getByRole("list", { name: "Active filters" });
    expect(within(bar).getByText("RPG - Roleplaying Game")).toBeInTheDocument();
    expect(within(bar).getByText("BGM - Board Game")).toBeInTheDocument();
    expect(within(bar).queryByRole("button", { name: /Type:/ })).toBeNull();
  });

  it("clicking RPG active-filter chip removes RPG but leaves BGM in URL", async () => {
    const user = userEvent.setup();
    const { router } = await renderRoute("/?eventType=RPG%2CBGM");
    const bar = screen.getByRole("list", { name: "Active filters" });
    await user.click(within(bar).getByRole("button", { name: "Remove RPG - Roleplaying Game" }));
    expect(router.state.location.searchStr).toContain("eventType=BGM");
    expect(router.state.location.searchStr).not.toContain("RPG");
  });
});

describe("analytics events", () => {
  it("search_submitted fires with form values on Search click", async () => {
    const user = userEvent.setup();
    await renderRoute("/");
    await screen.findByRole("navigation", { name: "Pagination, top" });
    captureFn.mockClear();
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(captureFn).toHaveBeenCalledWith(
      "search_submitted",
      expect.objectContaining({ has_keyword: false }),
    );
  });

  it("search_filters_reset fires on Reset click", async () => {
    const user = userEvent.setup();
    await renderRoute("/?filter=dragon");
    await screen.findByRole("navigation", { name: "Pagination, top" });
    captureFn.mockClear();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(captureFn).toHaveBeenCalledWith("search_filters_reset");
  });

  it("filter_removed fires with filter id and label when chip is dismissed", async () => {
    const user = userEvent.setup();
    await renderRoute("/?filter=dragon");
    await screen.findByRole("button", { name: /Remove Search: dragon/ });
    captureFn.mockClear();
    await user.click(screen.getByRole("button", { name: /Remove Search: dragon/ }));
    expect(captureFn).toHaveBeenCalledWith("filter_removed", {
      filter_id: "filter",
      filter_label: "Search: dragon",
    });
  });

  it("results_page_changed fires with next page number on Next click", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/events/search", () =>
        HttpResponse.json<EventSearchResponse>({
          data: [makeEvent()],
          meta: { total: 200 },
          links: { self: "" },
          error: null,
        }),
      ),
    );
    await renderRoute("/");
    const topNav = await screen.findByRole("navigation", { name: "Pagination, top" });
    captureFn.mockClear();
    await user.click(within(topNav).getByRole("button", { name: "Next" }));
    await screen.findByRole("navigation", { name: "Pagination, top" });
    expect(captureFn).toHaveBeenCalledWith(
      "results_page_changed",
      expect.objectContaining({ page: 2 }),
    );
  });

  it("results_sorted fires with field and direction on column header click", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/events/search", () =>
        HttpResponse.json<EventSearchResponse>({
          data: [makeEvent()],
          meta: { total: 200 },
          links: { self: "" },
          error: null,
        }),
      ),
    );
    await renderRoute("/");
    await screen.findByRole("navigation", { name: "Pagination, top" });
    captureFn.mockClear();
    await user.click(screen.getByRole("button", { name: "Start" }));
    await screen.findByRole("navigation", { name: "Pagination, top" });
    expect(captureFn).toHaveBeenCalledWith(
      "results_sorted",
      expect.objectContaining({ sort_field: "startDateTime", sort_direction: "asc" }),
    );
  });
});
