import { expect, test, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
import type { Event } from "../../utils/types";

beforeEach(() => {
  localStorage.clear();
});

async function renderEventTable(events: Event[] = [makeEvent()]): Promise<void> {
  const rootRoute = createRootRoute({
    component: () => <EventTable events={events} />,
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
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
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
  await user.click(screen.getByRole("checkbox", { name: "Title" }));
  expect(screen.queryByRole("columnheader", { name: "Title" })).not.toBeInTheDocument();
});

test("'Customize columns' panel contains the type display slider", async () => {
  await renderEventTable();
  expect(screen.getByRole("slider", { name: "Type display" })).toBeInTheDocument();
});

test("changing slider to Code shows only the type code in the Type column", async () => {
  const user = userEvent.setup();
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  await user.click(screen.getByText("Customize columns"));
  const slider = screen.getByRole("slider", { name: "Type display" });
  fireEvent.change(slider, { target: { value: "0" } }); // position 0 = code
  expect(screen.getByRole("cell", { name: "RPG" })).toBeInTheDocument();
  expect(screen.queryByText("RPG - Role Playing Game")).not.toBeInTheDocument();
});

test("changing slider to Name shows only the event type name in the Type column", async () => {
  const user = userEvent.setup();
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  await user.click(screen.getByText("Customize columns"));
  const slider = screen.getByRole("slider", { name: "Type display" });
  fireEvent.change(slider, { target: { value: "1" } }); // position 1 = name
  expect(screen.getByRole("cell", { name: "Role Playing Game" })).toBeInTheDocument();
});

test("Reset to defaults restores slider to Both and shows full type label", async () => {
  const user = userEvent.setup();
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  await user.click(screen.getByText("Customize columns"));
  const slider = screen.getByRole("slider", { name: "Type display" });
  fireEvent.change(slider, { target: { value: "0" } }); // move to Code
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(slider).toHaveValue("2"); // back to Both
  expect(screen.getByRole("cell", { name: "RPG - Role Playing Game" })).toBeInTheDocument();
});
