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
  expect(screen.getByRole("combobox", { name: "Event Type" })).toHaveValue(
    "BGM",
  );
});

test("updates form when URL search params change after initial render", async () => {
  const router = await renderSearchPage("/?eventType=BGM");
  expect(screen.getByRole("combobox", { name: "Event Type" })).toHaveValue(
    "BGM",
  );

  await act(async () => {
    await router.navigate({ to: "/", search: { eventType: "RPG" } });
  });

  expect(screen.getByRole("combobox", { name: "Event Type" })).toHaveValue(
    "RPG",
  );
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
