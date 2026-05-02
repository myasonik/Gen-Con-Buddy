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

async function renderList(
  events: Event[] = [makeEvent()],
  visibility?: Partial<Record<string, boolean>>,
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () => <EventListMobile events={events} visibility={visibility} />,
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

test("hides title when visibility.title is false", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })], { title: false });
  expect(screen.queryByText("Dragon Hunt")).not.toBeInTheDocument();
});

test("shows title when visibility.title is true", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })], { title: true });
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("hides event type when visibility.eventType is false", async () => {
  await renderList([makeEvent({ eventType: "TCG" })], { eventType: false });
  expect(screen.queryByText("TCG")).not.toBeInTheDocument();
});

test("hides tickets when visibility.ticketsAvailable is false", async () => {
  await renderList([makeEvent({ ticketsAvailable: 5 })], { ticketsAvailable: false });
  expect(screen.queryByText("5 tickets")).not.toBeInTheDocument();
});

test("hides day but shows start time when only startDateTime is visible", async () => {
  await renderList([makeEvent()], { day: false, startDateTime: true, endDateTime: false });
  expect(screen.queryByText(/Thu/)).not.toBeInTheDocument();
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
});

test("hides all time info when day, startDateTime, and endDateTime are all false", async () => {
  await renderList([makeEvent()], { day: false, startDateTime: false, endDateTime: false });
  expect(screen.queryByText(/Thu/)).not.toBeInTheDocument();
  expect(screen.queryByText(/06:00/)).not.toBeInTheDocument();
});

test("hides player count when both minPlayers and maxPlayers are false", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: false,
    maxPlayers: false,
  });
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("shows only minPlayers value when maxPlayers is hidden", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: true,
    maxPlayers: false,
  });
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("shows only maxPlayers value when minPlayers is hidden", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: false,
    maxPlayers: true,
  });
  expect(screen.getByText("6")).toBeInTheDocument();
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("uses COLUMN_VISIBILITY_DEFAULTS when no visibility prop is passed", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("shows day and end time with no separator when startDateTime is hidden", async () => {
  await renderList([makeEvent()], {
    day: true,
    startDateTime: false,
    endDateTime: true,
    minPlayers: false,
    maxPlayers: false,
  });
  expect(screen.getByText(/Thu/)).toBeInTheDocument();
  expect(screen.getByText(/10:00/)).toBeInTheDocument();
  expect(screen.queryByText(/–/)).not.toBeInTheDocument();
});
