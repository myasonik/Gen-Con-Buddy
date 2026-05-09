import React from "react";
import { expect, test, beforeEach, vi, afterEach } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { makeEvent } from "../../test/msw/factory";
import { EventTable } from "./EventTable";
import type { DayFormat, SharedColumnState, TypeDisplay } from "./types";
import type { Event } from "../../utils/types";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { useDayFormat } from "../../hooks/useDayFormat";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

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
    ...overrides,
  };
}

function EventTableWithHooks({
  events,
  showColumnControls = true,
}: {
  events: Event[];
  showColumnControls?: boolean;
}): React.JSX.Element {
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  const sharedColumnState: SharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
  };
  return (
    <EventTable
      events={events}
      sharedColumnState={sharedColumnState}
      showColumnControls={showColumnControls}
    />
  );
}

async function renderEventTable(
  events: Event[] = [makeEvent()],
  sharedColumnState?: SharedColumnState,
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () =>
      sharedColumnState !== undefined ? (
        <EventTable
          events={events}
          sharedColumnState={sharedColumnState}
          showColumnControls={false}
        />
      ) : (
        <EventTableWithHooks events={events} showColumnControls />
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
  await router.load();
  let result: ReturnType<typeof render> | null = null;
  await act(async () => {
    result = render(<RouterProvider router={router} />);
  });
  return result as unknown as ReturnType<typeof render>;
}

test("renders a table row for each event", async () => {
  await renderEventTable([makeEvent(), makeEvent()]);
  const rows = screen.getAllByRole("row");
  expect(rows).toHaveLength(3); // 1 header + 2 data rows
});

test("renders empty state when no events provided", async () => {
  await renderEventTable([]);
  expect(screen.getByText("No events.")).toBeInTheDocument();
});

test("title column is visible by default and shows event title", async () => {
  await renderEventTable([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("title link points to the event detail route", async () => {
  await renderEventTable([makeEvent({ gameId: "RPG24000042", title: "Dragon Hunt" })]);
  expect(screen.getByRole("link", { name: "Dragon Hunt" })).toHaveAttribute(
    "href",
    "/event/RPG24000042",
  );
});

test("renders the column visibility panel", async () => {
  await renderEventTable();
  expect(screen.getByText("Customize columns")).toBeInTheDocument();
});

test("toggling a column off hides its header", async () => {
  const user = userEvent.setup();
  await renderEventTable();
  await user.click(screen.getByRole("button", { name: /Customize columns/ }));
  await user.click(screen.getByRole("checkbox", { name: "Title" }));
  expect(screen.queryByRole("columnheader", { name: "Title" })).not.toBeInTheDocument();
});

test("eventType column renders an icon alongside the type code", async () => {
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  const cell = screen.getAllByRole("cell").find((c) => c.textContent?.includes("RPG"));
  expect(cell?.querySelector("svg")).not.toBeNull();
});

test("type cell renders the event type code for icon coloring", async () => {
  await renderEventTable(
    [makeEvent({ eventType: "RPG" })],
    makeSharedColumnState({ typeDisplay: "code" }),
  );
  expect(screen.getAllByText("RPG").length).toBeGreaterThan(0);
});

test("type cell renders the board game event type code", async () => {
  await renderEventTable(
    [makeEvent({ eventType: "BGM" })],
    makeSharedColumnState({ typeDisplay: "code" }),
  );
  expect(screen.getAllByText("BGM").length).toBeGreaterThan(0);
});

test("ticketsAvailable column shows 'Sold out' when ticketsAvailable is 0", async () => {
  await renderEventTable([makeEvent({ ticketsAvailable: 0 })]);
  expect(screen.getByText("Sold out")).toBeInTheDocument();
});

test("resize handles portal into the table clip wrapper, not document.body", async () => {
  await renderEventTable([makeEvent()]);
  const handles = screen.getAllByTestId(/^resize-handle-/);
  expect(handles.length).toBeGreaterThan(0);
  const clipWrapper = document.querySelector("[data-testid='table-clip-wrapper']");
  expect(clipWrapper).not.toBeNull();
  expect(clipWrapper).toContainElement(handles[0]);
});

test("td cells carry data-col-id attributes matching their column id", async () => {
  await renderEventTable([makeEvent()]);
  // Title is visible by default — all its cells should be tagged
  const titleCells = document.querySelectorAll('td[data-col-id="title"]');
  expect(titleCells).toHaveLength(1);
});

test("resize dialog input has min attribute reflecting measured cell content", async () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    measureText: (text: string) => ({ width: text.length * 8 }),
    font: "",
  } as unknown as CanvasRenderingContext2D);

  const user = userEvent.setup();
  // 2024-08-07 is a Wednesday — longest day name = 9 chars × 8 = 72px + 2px jsdom padding = 74
  await renderEventTable([makeEvent({ startDateTime: "2024-08-07T10:00:00Z" })]);

  const dayHeader = screen.getByRole("columnheader", { name: /Day/ });
  await user.click(within(dayHeader).getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));

  await waitFor(() => {
    expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveAttribute("min", "74");
  });
});

test("type cell shows typeCode span and hides typeName when typeDisplay is code", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG - Roleplaying Game" })],
    makeSharedColumnState({ typeDisplay: "code" }),
  );
  expect(container.querySelector('[class*="typeCode"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeName"]')).toBeNull();
});

test("type cell shows typeName span and hides typeCode when typeDisplay is name", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG - Roleplaying Game" })],
    makeSharedColumnState({ typeDisplay: "name" }),
  );
  expect(container.querySelector('[class*="typeName"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeCode"]')).toBeNull();
});

test("type cell shows both typeCode and typeName spans when typeDisplay is both", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG - Roleplaying Game" })],
    makeSharedColumnState({ typeDisplay: "both" }),
  );
  expect(container.querySelector('[class*="typeCode"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeName"]')).not.toBeNull();
});

test("type cell omits SVG icon when showTypeIcon is false", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG" })],
    makeSharedColumnState({ showTypeIcon: false }),
  );
  const typeCell = container.querySelector('[class*="typeCell"]');
  expect(typeCell?.querySelector("svg")).toBeNull();
});

test("day cell shows full weekday name in day mode", async () => {
  // factory startDateTime 2024-08-01T10:00:00Z = Thursday in Indianapolis
  await renderEventTable([makeEvent()], makeSharedColumnState({ dayFormat: "day" }));
  expect(screen.getByText("Thursday")).toBeInTheDocument();
});

test("day cell shows numeric date in numeric mode", async () => {
  await renderEventTable([makeEvent()], makeSharedColumnState({ dayFormat: "numeric" }));
  expect(screen.getByText("08/01/24")).toBeInTheDocument();
});

test("day cell shows long date in long mode", async () => {
  await renderEventTable([makeEvent()], makeSharedColumnState({ dayFormat: "long" }));
  expect(screen.getByText("Thu, Aug 01, 2024")).toBeInTheDocument();
});
