import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ColumnControlsPanel } from "./ColumnControlsPanel";
import { COLUMNS } from "./columns";
import type { SharedColumnState } from "./types";

function makeColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: Object.fromEntries(COLUMNS.map((c) => [c.id, true])),
    toggleVisibility: vi.fn<SharedColumnState["toggleVisibility"]>(),
    resetVisibility: vi.fn<SharedColumnState["resetVisibility"]>(),
    sizing: {},
    setSizing: vi.fn<SharedColumnState["setSizing"]>(),
    resetSizing: vi.fn<SharedColumnState["resetSizing"]>(),
    ...overrides,
  };
}

test("renders four column groups matching EventDetail sections", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Players" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Logistics" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
});

test("Title toggle is inside the The Event group", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  const group = screen.getByRole("group", { name: "The Event" });
  expect(within(group).getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
});

test("Min Players toggle is inside the Players group", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  const group = screen.getByRole("group", { name: "Players" });
  expect(within(group).getByRole("checkbox", { name: "Min Players" })).toBeInTheDocument();
});

test("Duration toggle is inside the Logistics group", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  const group = screen.getByRole("group", { name: "Logistics" });
  expect(within(group).getByRole("checkbox", { name: "Duration" })).toBeInTheDocument();
});

test("GMs toggle is inside the Contact group", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  const group = screen.getByRole("group", { name: "Contact" });
  expect(within(group).getByRole("checkbox", { name: "GMs" })).toBeInTheDocument();
});

test("variant=drawer renders a Customize columns button", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  expect(screen.getByRole("button", { name: "Customize columns" })).toBeInTheDocument();
});

test("variant=drawer does not show column groups before the button is clicked", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});

test("variant=drawer opens dialog showing all column groups on button click", async () => {
  const user = userEvent.setup();
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  await user.click(screen.getByRole("button", { name: "Customize columns" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Players" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Logistics" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
});

test("variant=drawer shows column checkboxes inside the opened dialog", async () => {
  const user = userEvent.setup();
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  await user.click(screen.getByRole("button", { name: "Customize columns" }));
  expect(screen.getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
});

test("variant=drawer Close button dismisses the dialog", async () => {
  const user = userEvent.setup();
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  await user.click(screen.getByRole("button", { name: "Customize columns" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});
