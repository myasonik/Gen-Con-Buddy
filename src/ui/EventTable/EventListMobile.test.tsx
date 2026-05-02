import { act, render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { expect, test } from "vitest";
import { makeEvent } from "../../test/msw/factory";
import { EventListMobile } from "./EventListMobile";
import type { Event } from "../../utils/types";
import type { TypeDisplay } from "./types";

async function renderList(
  events: Event[] = [makeEvent()],
  props: { typeDisplay?: TypeDisplay; showTypeIcon?: boolean } = {},
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () => <EventListMobile events={events} {...props} />,
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
  await router.load();
  let result: ReturnType<typeof render> | null = null;
  await act(async () => {
    result = render(<RouterProvider router={router} />);
  });
  return result as unknown as ReturnType<typeof render>;
}

test("renders a list item for each event", async () => {
  await renderList([makeEvent(), makeEvent()]);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

test("shows the event title", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("each event row links to its detail route", async () => {
  await renderList([makeEvent({ gameId: "RPG24000042", title: "Dragon Hunt" })]);
  const title = screen.getByText("Dragon Hunt");
  expect(title.closest("a")).toHaveAttribute("href", "/event/RPG24000042");
});

test("shows the event type", async () => {
  await renderList([makeEvent({ eventType: "TCG" })]);
  expect(screen.getByText("TCG")).toBeInTheDocument();
});

test("shows day abbreviation derived from startDateTime", async () => {
  // factory: startDateTime "2024-08-01T10:00:00Z" → Aug 1 2024 = Thursday
  await renderList([makeEvent()]);
  expect(screen.getByText(/Thu/)).toBeInTheDocument();
});

test("shows formatted start time from startDateTime", async () => {
  // "2024-08-01T10:00:00Z" → 06:00 in Indianapolis (EDT = UTC-4)
  await renderList([makeEvent()]);
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
});

test("shows formatted end time from endDateTime", async () => {
  // "2024-08-01T14:00:00Z" → 10:00 in Indianapolis
  await renderList([makeEvent()]);
  expect(screen.getByText(/10:00/)).toBeInTheDocument();
});

test("shows ticket count when tickets are available", async () => {
  await renderList([makeEvent({ ticketsAvailable: 5 })]);
  expect(screen.getByText("5 tickets")).toBeInTheDocument();
});

test("shows singular ticket when only one is available", async () => {
  await renderList([makeEvent({ ticketsAvailable: 1 })]);
  expect(screen.getByText("1 ticket")).toBeInTheDocument();
});

test("shows sold out when ticketsAvailable is 0", async () => {
  await renderList([makeEvent({ ticketsAvailable: 0 })]);
  expect(screen.getByText("Sold out")).toBeInTheDocument();
});

test("shows player range when min and max differ", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })]);
  expect(screen.getByText("2–6")).toBeInTheDocument();
});

test("shows single player count when min equals max", async () => {
  await renderList([makeEvent({ minPlayers: 4, maxPlayers: 4 })]);
  expect(screen.getByText("4")).toBeInTheDocument();
});

test("renders an icon for a known event type", async () => {
  const { container } = await renderList([makeEvent({ eventType: "RPG" })]);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("renders event type name in the DOM", async () => {
  await renderList([makeEvent({ eventType: "RPG" })]);
  expect(screen.getByText("Role Playing Game")).toBeInTheDocument();
});

test("applies typeDisplayName class to list when typeDisplay is name", async () => {
  const { container } = await renderList([makeEvent()], { typeDisplay: "name" });
  expect(container.querySelector('[class*="typeDisplayName"]')).not.toBeNull();
});

test("applies typeDisplayCode class to list when typeDisplay is code", async () => {
  const { container } = await renderList([makeEvent()], { typeDisplay: "code" });
  expect(container.querySelector('[class*="typeDisplayCode"]')).not.toBeNull();
});

test("applies typeHideIcon class when showTypeIcon is false", async () => {
  const { container } = await renderList([makeEvent()], { showTypeIcon: false });
  expect(container.querySelector('[class*="typeHideIcon"]')).not.toBeNull();
});

test("no text mode class applied when typeDisplay is both", async () => {
  const { container } = await renderList([makeEvent()], { typeDisplay: "both" });
  expect(container.querySelector('[class*="typeDisplayCode"]')).toBeNull();
  expect(container.querySelector('[class*="typeDisplayName"]')).toBeNull();
});
