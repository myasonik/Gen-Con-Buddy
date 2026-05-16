import { StrictMode, useEffect } from "react";
import { expect, test } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { makeEvent } from "../../test/msw/factory";
import { EventDetail } from "./EventDetail";
import type { EventSearchResponse } from "../../utils/types";

function renderEventDetail(gameId: string): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => <EventDetail gameId={gameId} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
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

test("renders error state when API returns HTTP 500", async () => {
  server.use(http.get("/api/events/search", () => new HttpResponse(null, { status: 500 })));
  renderEventDetail("RPG24000001");
  await expect(screen.findByText("QUEST FAILED")).resolves.toBeInTheDocument();
  expect(screen.getByText("Unable to load event. Please try again.")).toBeInTheDocument();
});

test("shows loading state while fetching", async () => {
  renderEventDetail("RPG24000001");
  await expect(screen.findByText("LOADING QUEST...")).resolves.toBeInTheDocument();
});

test("renders event title and gameId after load", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await expect(screen.findByText("Epic Dragon Hunt")).resolves.toBeInTheDocument();
  expect(screen.getByText("RPG24000001")).toBeInTheDocument();
});

test("renders all key event attributes", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [
          makeEvent({
            gameId: "RPG24000001",
            title: "Epic Dragon Hunt",
            shortDescription: "Hunt the dragon",
            location: "ICC Hall A",
            gmNames: "Jane Doe",
            cost: 4,
          }),
        ],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("Epic Dragon Hunt");
  expect(screen.getByText("Hunt the dragon")).toBeInTheDocument();
  expect(screen.getByText("ICC Hall A")).toBeInTheDocument();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("$4.00")).toBeInTheDocument();
});

test("shows not-found message when event does not exist", async () => {
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
  renderEventDetail("DOESNOTEXIST");
  await expect(screen.findByText("EVENT NOT FOUND")).resolves.toBeInTheDocument();
});

test("fetches using the provided gameId as a query param", async () => {
  let capturedUrl: string | undefined = undefined;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = request.url;
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "BGM24000099" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("BGM24000099");
  await screen.findAllByRole("term");
  expect(capturedUrl).toContain("gameId=BGM24000099");
});

test("renders THE EVENT section heading", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("Epic Dragon Hunt");
  expect(screen.getByRole("heading", { name: "THE EVENT" })).toBeInTheDocument();
});

test("renders PLAYERS section heading", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByRole("heading", { name: "THE EVENT" });
  expect(screen.getByRole("heading", { name: "PLAYERS" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "LOGISTICS" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "CONTACT" })).toBeInTheDocument();
});

test("renders Add to Google Calendar link", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  const link = screen.getByRole("link", { name: /add to google calendar/i });
  expect(link).toHaveAttribute(
    "href",
    expect.stringContaining("calendar.google.com/calendar/render"),
  );
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link.getAttribute("href")).toContain("text=Test+Event");
});

test("renders View on Gen Con link using numeric event id", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "BGM26ND310286" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("BGM26ND310286");
  await screen.findByText("THE EVENT");
  const link = screen.getByRole("link", { name: /view on gen con/i });
  expect(link).toHaveAttribute("href", "https://www.gencon.com/events/310286");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("action links appear after the event title and before THE EVENT section", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  const title = screen.getByRole("heading", { level: 1, name: "Epic Dragon Hunt" });
  const calLink = screen.getByRole("link", { name: /add to google calendar/i });
  const sectionHeading = screen.getByRole("heading", { name: "THE EVENT" });
  expect(title.compareDocumentPosition(calLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(calLink.compareDocumentPosition(sectionHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("event type icon is aria-hidden so assistive tech relies on the text label", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", eventType: "RPG" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  const dd = screen.getByText("RPG").closest("dd");
  const svg = dd?.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg).toHaveAttribute("aria-hidden", "true");
});

test("shows sold-out badge when tickets available is zero", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", ticketsAvailable: 0 })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  expect(screen.getByText("Sold out")).toBeInTheDocument();
  expect(screen.queryByText("0")).toBeNull();
});

test("shows ticket count when tickets are available", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", ticketsAvailable: 5 })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  expect(screen.getByText("5")).toBeInTheDocument();
  expect(screen.queryByText("Sold out")).toBeNull();
});

test("event type field renders an icon alongside the type code", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", eventType: "RPG" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  const dd = screen.getByText("RPG").closest("dd");
  expect(dd?.querySelector("svg")).not.toBeNull();
});

test("renders website as a hyperlink when it is a valid https URL", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", website: "https://example.com" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("CONTACT");
  const link = screen.getByRole("link", { name: "https://example.com" });
  expect(link).toHaveAttribute("href", "https://example.com/");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer noopener");
});

test("renders website as a hyperlink when it has a www. prefix", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", website: "www.example.com" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("CONTACT");
  const link = screen.getByRole("link", { name: "www.example.com" });
  expect(link).toHaveAttribute("href", "https://www.example.com/");
});

test("renders website as plain text when it contains a dangerous javascript: scheme", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        // oxlint-disable-next-line no-script-url
        data: [makeEvent({ gameId: "RPG24000001", website: "javascript:alert(1)" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("CONTACT");
  // oxlint-disable-next-line no-script-url
  expect(screen.queryByRole("link", { name: "javascript:alert(1)" })).toBeNull();
  // oxlint-disable-next-line no-script-url
  expect(screen.getByText("javascript:alert(1)")).toBeInTheDocument();
});

test("renders email as a mailto: link when it is a valid email address", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", email: "gm@example.com" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("CONTACT");
  const link = screen.getByRole("link", { name: "gm@example.com" });
  expect(link).toHaveAttribute("href", "mailto:gm@example.com");
  expect(link).not.toHaveAttribute("target");
  expect(link).not.toHaveAttribute("rel");
});

test('displays "None" when special category is the string "none"', async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", specialCategory: "none" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  expect(screen.getByText("None")).toBeInTheDocument();
});

test("renders email as plain text when it is not a valid email", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", email: "not-an-email" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("CONTACT");
  expect(screen.queryByRole("link", { name: "not-an-email" })).toBeNull();
  expect(screen.getByText("not-an-email")).toBeInTheDocument();
});

test("shows Staff Pick chip on Wildhavens event detail page", async () => {
  const [gameId] = WILDHAVENS_GAME_IDS;
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail(gameId);
  await screen.findByText("THE EVENT");
  expect(screen.getByText("Staff Pick")).toBeInTheDocument();
});

test("does not show Staff Pick chip on non-Wildhavens event detail page", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("THE EVENT");
  expect(screen.queryByText("Staff Pick")).toBeNull();
});

test("card has data-staff-pick attribute for Wildhavens events", async () => {
  const [gameId] = WILDHAVENS_GAME_IDS;
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  const { container } = renderEventDetail(gameId);
  await screen.findByText("THE EVENT");
  expect(container.querySelector("[data-staff-pick]")).not.toBeNull();
});

test("renders 'Back to changelog' button when navigated from changelog", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json<EventSearchResponse>({
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );

  // Use a two-route setup so TanStack Router's navigate sets location.state correctly.
  // history.push() alone doesn't serialize state in the format useLocation() reads.
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const fromRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/changelog",
    component() {
      const navigate = useNavigate();
      useEffect(() => {
        // @ts-expect-error — local test router uses /event; app router has /event/$id
        void navigate({ to: "/event", state: { from: "changelog" } });
      }, [navigate]);
      return null;
    },
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event",
    component: () => <EventDetail gameId="RPG24000001" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([fromRoute, eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/changelog"] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    );
  });
  await screen.findByText("Epic Dragon Hunt");
  expect(screen.getByRole("button", { name: /back to changelog/i })).toBeInTheDocument();
});
