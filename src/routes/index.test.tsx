import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw/server";
import { makeEvent } from "../test/msw/factory";
import type { EventSearchResponse } from "../utils/types";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "../routeTree.gen";

async function renderSearchPage(initialEntry = "/") {
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({ routeTree, history });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await router.load();
  await act(async () => {
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  });
  return router;
}

test("populates eventType dropdown from URL search param on load", async () => {
  await renderSearchPage("/?eventType=BGM");
  expect(
    screen.getByRole("button", { name: "Remove BGM" }),
  ).toBeInTheDocument();
});

test("updates form when URL search params change after initial render", async () => {
  const router = await renderSearchPage("/?eventType=BGM");
  expect(
    screen.getByRole("button", { name: "Remove BGM" }),
  ).toBeInTheDocument();

  await act(async () => {
    await router.navigate({ to: "/", search: { eventType: "RPG" } });
  });

  expect(
    screen.getByRole("button", { name: "Remove RPG" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Remove BGM" }),
  ).not.toBeInTheDocument();
});

test("page param is read from URL without crashing", async () => {
  await renderSearchPage("/?page=3");
  expect(screen.getByRole("main")).toBeInTheDocument();
});

test("limit param is read from URL without crashing", async () => {
  await renderSearchPage("/?limit=500");
  expect(screen.getByRole("main")).toBeInTheDocument();
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
  await renderSearchPage("/?page=3");
  await screen.findAllByRole("navigation", { name: "Pagination" });
  latestUrl = null;
  // Submit the search form (clicking Search button resets page)
  await user.click(screen.getByRole("button", { name: "▶ Search" }));
  await screen.findAllByRole("navigation", { name: "Pagination" });
  expect(latestUrl!.searchParams.has("page")).toBe(false);
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
  await renderSearchPage("/");
  // wait for initial render and pagination
  await screen.findAllByRole("navigation", { name: "Pagination" });
  latestUrl = null;
  // click Next on the first pagination nav
  const navs = screen.getAllByRole("navigation", { name: "Pagination" });
  await user.click(within(navs[0]).getByRole("button", { name: "Next ▶" }));
  // wait for re-render after navigation
  await screen.findAllByRole("navigation", { name: "Pagination" });
  expect(latestUrl!.searchParams.get("page")).toBe("1");
});

test("sort param is read from URL without crashing", async () => {
  await renderSearchPage("/?sort=startDateTime.asc");
  expect(screen.getByRole("main")).toBeInTheDocument();
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
  await renderSearchPage("/?page=3");
  await screen.findAllByRole("navigation", { name: "Pagination" });
  latestUrl = null;
  await user.click(screen.getByRole("button", { name: "Sort by Start" }));
  await screen.findAllByRole("navigation", { name: "Pagination" });
  expect(latestUrl!.searchParams.has("page")).toBe(false);
  expect(latestUrl!.searchParams.get("sort")).toBe("startDateTime.asc");
});

test("renders a banner landmark with the app title", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("banner")).toHaveTextContent("Gen Con Buddy");
});

test("site header contains the app title", async () => {
  await renderSearchPage();
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
  await renderSearchPage("/?page=2");
  await screen.findAllByRole("navigation", { name: "Pagination" });
  latestUrl = null;
  const navs = screen.getAllByRole("navigation", { name: "Pagination" });
  await user.click(within(navs[0]).getByRole("button", { name: "◀ Previous" }));
  await screen.findAllByRole("navigation", { name: "Pagination" });
  expect(latestUrl!.searchParams.has("page")).toBe(false);
});

test("renders SEARCH fieldset in search form", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("group", { name: "SEARCH" })).toBeInTheDocument();
});

test("renders DAYS fieldset in search form", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("group", { name: "DAYS" })).toBeInTheDocument();
});

test("day tiles are toggle buttons with aria-pressed", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("day toggle tiles have concept color style properties", async () => {
  await renderSearchPage();
  const thuBtn = screen.getByRole("button", { name: "Thu" });
  expect(thuBtn.style.getPropertyValue("--tile-color")).toBe("#7a4a00");
  expect(thuBtn.style.getPropertyValue("--tile-color-bg")).toBe("#fdf0d8");
});

test("results table rows include a day stripe cell", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({
        data: [
          makeEvent({
            eventType: "RPG",
            experienceRequired:
              "None (You've never played before - rules will be taught)",
            startDateTime: "2025-08-07T10:00:00-05:00", // Thursday
          }),
        ],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  await renderSearchPage();
  await screen.findByRole("table");
  expect(
    document.querySelector('[data-testid="day-stripe"]'),
  ).toBeInTheDocument();
});

test("eventType column renders a ConceptBadge", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({
        data: [makeEvent({ eventType: "RPG" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  await renderSearchPage();
  await screen.findByRole("table");
  expect(screen.getByText("RPG")).toBeInTheDocument();
});

describe("sidebar toggle and active filters", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("sidebar toggle button is present in the results area", async () => {
    await renderSearchPage("/");
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
  });

  test("sidebar toggle button has aria-expanded=true by default", async () => {
    await renderSearchPage("/");
    expect(screen.getByRole("button", { name: /Filters/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("clicking toggle button flips aria-expanded to false", async () => {
    const user = userEvent.setup();
    await renderSearchPage("/");
    const btn = screen.getByRole("button", { name: /Filters/ });
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  test("no active filter chips when no filters are set", async () => {
    await renderSearchPage("/");
    expect(screen.queryByRole("button", { name: /Search:/ })).toBeNull();
  });

  test("active filter chip appears when filter param is in URL", async () => {
    await renderSearchPage("/?filter=dragon");
    expect(
      screen.getByRole("button", { name: /Search: dragon/ }),
    ).toBeInTheDocument();
  });

  test("clicking a filter chip removes it from the URL", async () => {
    const user = userEvent.setup();
    const router = await renderSearchPage("/?filter=dragon&location=Hall+A");
    expect(
      screen.getByRole("button", { name: /Search: dragon/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Search: dragon/ }));
    expect(router.state.location.searchStr).not.toContain("filter=");
    expect(router.state.location.searchStr).toContain("location=");
  });

  test("days filter produces one chip per day", async () => {
    await renderSearchPage("/?days=fri%2Csat");
    const bar = screen.getByRole("list", { name: "Active filters" });
    expect(
      within(bar).getByRole("button", { name: "Fri" }),
    ).toBeInTheDocument();
    expect(
      within(bar).getByRole("button", { name: "Sat" }),
    ).toBeInTheDocument();
    expect(within(bar).queryByRole("button", { name: /Days:/ })).toBeNull();
  });

  test("clicking Fri chip removes fri but leaves sat in URL", async () => {
    const user = userEvent.setup();
    const router = await renderSearchPage("/?days=fri%2Csat");
    const bar = screen.getByRole("list", { name: "Active filters" });
    await user.click(within(bar).getByRole("button", { name: "Fri" }));
    expect(router.state.location.searchStr).toContain("days=sat");
    expect(router.state.location.searchStr).not.toContain("fri");
  });

  test("eventType filter produces one chip per code", async () => {
    await renderSearchPage("/?eventType=RPG%2CBGM");
    const bar = screen.getByRole("list", { name: "Active filters" });
    expect(
      within(bar).getByRole("button", { name: "RPG - Role Playing Game" }),
    ).toBeInTheDocument();
    expect(
      within(bar).getByRole("button", { name: "BGM - Board Game" }),
    ).toBeInTheDocument();
    expect(within(bar).queryByRole("button", { name: /Type:/ })).toBeNull();
  });

  test("clicking RPG active-filter chip removes RPG but leaves BGM in URL", async () => {
    const user = userEvent.setup();
    const router = await renderSearchPage("/?eventType=RPG%2CBGM");
    const bar = screen.getByRole("list", { name: "Active filters" });
    await user.click(
      within(bar).getByRole("button", { name: "RPG - Role Playing Game" }),
    );
    expect(router.state.location.searchStr).toContain("eventType=BGM");
    expect(router.state.location.searchStr).not.toContain("RPG");
  });
});
