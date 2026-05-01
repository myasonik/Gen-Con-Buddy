import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../../ui/EventTable/types";
import { makeChangelogEntry, makeEvent } from "../../test/msw/factory";
import type { ChangelogEntry } from "../../utils/types";

const stubColumnState: SharedColumnState = {
  visibility: {},
  toggleVisibility: () => {},
  resetVisibility: () => {},
  sizing: {},
  setSizing: () => {},
  resetSizing: () => {},
};

// For tests that render EventTable (which uses Link), a router context is required.
function renderPanelWithRouter(entry: ChangelogEntry): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => <ChangelogEntryPanel entry={entry} sharedColumnState={stubColumnState} />,
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
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

// Simple states render only a <p> — no router required.
test("shows loading indicator when entry is undefined", () => {
  render(<ChangelogEntryPanel entry={undefined} sharedColumnState={stubColumnState} />);
  expect(screen.getByText("Loading…")).toBeInTheDocument();
});

test('shows loading indicator when entry is "loading"', () => {
  render(<ChangelogEntryPanel entry="loading" sharedColumnState={stubColumnState} />);
  expect(screen.getByText("Loading…")).toBeInTheDocument();
});

test('shows error message when entry is "error"', () => {
  render(<ChangelogEntryPanel entry="error" sharedColumnState={stubColumnState} />);
  expect(screen.getByText(/could not load this entry/i)).toBeInTheDocument();
});

test("renders event table with created events when entry has data", async () => {
  const entry = makeChangelogEntry({
    createdEvents: [makeEvent({ title: "Epic Quest" })],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry);
  await expect(screen.findByText("Epic Quest")).resolves.toBeInTheDocument();
});

test("renders Created section heading with count", async () => {
  const entry = makeChangelogEntry({
    createdEvents: [makeEvent(), makeEvent()],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry);
  await expect(screen.findByText("Created (2)")).resolves.toBeInTheDocument();
});

test("does not render Updated section when updatedEvents is empty", async () => {
  const entry = makeChangelogEntry({
    createdEvents: [makeEvent()],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry);
  await screen.findByText("Created (1)");
  expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
});

test("does not render Deleted section when deletedEvents is empty", async () => {
  const entry = makeChangelogEntry({
    createdEvents: [makeEvent()],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry);
  await screen.findByText("Created (1)");
  expect(screen.queryByText(/Deleted/)).not.toBeInTheDocument();
});

test("renders all three sections when all groups have events", async () => {
  const entry = makeChangelogEntry({
    createdEvents: [makeEvent()],
    updatedEvents: [makeEvent()],
    deletedEvents: [makeEvent()],
  });
  renderPanelWithRouter(entry);
  await expect(screen.findByText("Created (1)")).resolves.toBeInTheDocument();
  expect(screen.getByText("Updated (1)")).toBeInTheDocument();
  expect(screen.getByText("Deleted (1)")).toBeInTheDocument();
});
