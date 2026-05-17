import { render, screen } from "@testing-library/react";
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
    typeDisplay: "name",
    setTypeDisplay: vi.fn<SharedColumnState["setTypeDisplay"]>(),
    showTypeIcon: true,
    setShowTypeIcon: vi.fn<SharedColumnState["setShowTypeIcon"]>(),
    resetTypeDisplay: vi.fn<SharedColumnState["resetTypeDisplay"]>(),
    dayFormat: "day",
    setDayFormat: vi.fn<SharedColumnState["setDayFormat"]>(),
    resetDayFormat: vi.fn<SharedColumnState["resetDayFormat"]>(),
    timeZone: "indy",
    setTimeZone: vi.fn<SharedColumnState["setTimeZone"]>(),
    resetTimeZone: vi.fn<SharedColumnState["resetTimeZone"]>(),
    timeFormat: "auto",
    setTimeFormat: vi.fn<SharedColumnState["setTimeFormat"]>(),
    resetTimeFormat: vi.fn<SharedColumnState["resetTimeFormat"]>(),
    ...overrides,
  };
}

test("renders the Visibility drawer trigger", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
});

test("renders the Format drawer trigger", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
});

test("renders the Sort drawer trigger when allowSort is true", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} allowSort />);
  expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
});

test("does not render the Sort drawer trigger when allowSort is absent", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.queryByRole("button", { name: "Sort" })).toBeNull();
});
