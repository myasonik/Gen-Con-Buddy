import { render, screen, within } from "@testing-library/react";
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
