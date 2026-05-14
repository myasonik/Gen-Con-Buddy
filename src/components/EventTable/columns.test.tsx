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
): Promise<ReturnType<typeof render>> {
  const sharedColumnState = makeSharedColumnState();
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
