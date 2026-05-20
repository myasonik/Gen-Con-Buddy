import React from "react";
import { expect, test, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { makeEvent } from "../../test/msw/factory";
import { EventTable } from "./EventTable";
import type { SharedColumnState, DayFormat, TypeDisplay, TimeZone, TimeFormat } from "./types";
import { STAFF_PICK_IDS } from "../../utils/staffPicks";

beforeEach(() => {
  localStorage.clear();
});

const [STAFF_PICK_GAME_ID] = Array.from(STAFF_PICK_IDS);

function makeSharedColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: {},
    toggleVisibility: vi.fn<(id: string) => void>(),
    resetVisibility: vi.fn<() => void>(),
    sizing: {},
    setSizing: vi.fn<() => void>(),
    resetSizing: vi.fn<() => void>(),
    typeDisplay: "name",
    setTypeDisplay: vi.fn<(v: TypeDisplay) => void>(),
    showTypeIcon: true,
    setShowTypeIcon: vi.fn<(v: boolean) => void>(),
    resetTypeDisplay: vi.fn<() => void>(),
    dayFormat: "day",
    setDayFormat: vi.fn<(v: DayFormat) => void>(),
    resetDayFormat: vi.fn<() => void>(),
    timeZone: "indy",
    setTimeZone: vi.fn<(v: TimeZone) => void>(),
    resetTimeZone: vi.fn<() => void>(),
    timeFormat: "auto",
    setTimeFormat: vi.fn<(v: TimeFormat) => void>(),
    resetTimeFormat: vi.fn<() => void>(),
    ...overrides,
  };
}

async function renderEventTable(
  events: ReturnType<typeof makeEvent>[],
  columnStateOverrides: Partial<SharedColumnState> = {},
): Promise<ReturnType<typeof render>> {
  const sharedColumnState = makeSharedColumnState(columnStateOverrides);
  const rootRoute = createRootRoute({
    component: () => <EventTable events={events} sharedColumnState={sharedColumnState} />,
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

test("title cell shows 'Staff Pick' badge for staff pick event", async () => {
  await renderEventTable([makeEvent({ gameId: STAFF_PICK_GAME_ID, title: "Wildhavens Game" })]);
  expect(screen.getByText("Staff Pick")).toBeInTheDocument();
});

test("title cell shows no badge for non-staff-pick event", async () => {
  await renderEventTable([makeEvent({ gameId: "NOTASTAFFPICK001", title: "Regular Game" })]);
  expect(screen.queryByText("Staff Pick")).not.toBeInTheDocument();
});

test("title cell shows 'Sold out' chip when ticketsAvailable is 0", async () => {
  await renderEventTable([makeEvent({ ticketsAvailable: 0, title: "Sold Out Game" })]);
  const titleCell = screen.getByText("Sold Out Game").closest("td");
  expect(titleCell).not.toBeNull();
  expect(titleCell).toHaveTextContent("Sold out");
});

test("title cell does not show 'Sold out' chip when ticketsAvailable is greater than 0", async () => {
  await renderEventTable([makeEvent({ ticketsAvailable: 3, title: "Available Game" })]);
  const titleCell = screen.getByText("Available Game").closest("td");
  expect(titleCell).not.toBeNull();
  expect(titleCell).not.toHaveTextContent("Sold out");
});

test("ticketsAvailable cell shows 'Sold out' chip when ticketsAvailable is negative", async () => {
  await renderEventTable([makeEvent({ ticketsAvailable: -5, title: "Neg Tickets Game" })], {
    visibility: { ticketsAvailable: true },
  });
  const ticketsCell = screen
    .getAllByRole("cell")
    .find((cell) => cell.getAttribute("data-col-id") === "ticketsAvailable");
  expect(ticketsCell).toBeDefined();
  expect(ticketsCell).toHaveTextContent("Sold out");
});

test("title cell shows 'Sold out' chip when ticketsAvailable is negative", async () => {
  await renderEventTable([makeEvent({ ticketsAvailable: -3, title: "Negative Tickets Game" })]);
  const titleCell = screen.getByText("Negative Tickets Game").closest("td");
  expect(titleCell).not.toBeNull();
  expect(titleCell).toHaveTextContent("Sold out");
});

test("title cell shows 'Sold out' chip even when ticketsAvailable column is hidden", async () => {
  await renderEventTable([makeEvent({ ticketsAvailable: 0, title: "Hidden Column Game" })], {
    visibility: { ticketsAvailable: false },
  });
  const titleCell = screen.getByText("Hidden Column Game").closest("td");
  expect(titleCell).not.toBeNull();
  expect(titleCell).toHaveTextContent("Sold out");
});
