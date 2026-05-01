import { expect, test, beforeEach } from "vitest";
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
import type { TypeDisplay } from "../../hooks/useTypeDisplay";

beforeEach(() => {
  localStorage.clear();
});

async function renderWithTypeDisplay(typeDisplay: TypeDisplay, eventType = "RPG"): Promise<void> {
  localStorage.setItem(
    "gen-con-buddy-type-display",
    JSON.stringify({ version: 1, value: typeDisplay }),
  );
  const rootRoute = createRootRoute({
    component: () => <EventTable events={[makeEvent({ eventType })]} />,
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

test("shows code only when typeDisplay is 'code'", async () => {
  await renderWithTypeDisplay("code");
  expect(screen.getByRole("cell", { name: "RPG" })).toBeInTheDocument();
  expect(screen.queryByText("Role Playing Game")).not.toBeInTheDocument();
});

test("shows name only when typeDisplay is 'name'", async () => {
  await renderWithTypeDisplay("name");
  expect(screen.getByRole("cell", { name: "Role Playing Game" })).toBeInTheDocument();
  expect(screen.queryByText("RPG - Role Playing Game")).not.toBeInTheDocument();
});

test("shows code and name when typeDisplay is 'both'", async () => {
  await renderWithTypeDisplay("both");
  expect(screen.getByRole("cell", { name: "RPG - Role Playing Game" })).toBeInTheDocument();
});

test("falls back to raw code when event type is not in EVENT_TYPES", async () => {
  await renderWithTypeDisplay("name", "XYZ");
  expect(screen.getByRole("cell", { name: "XYZ" })).toBeInTheDocument();
});
