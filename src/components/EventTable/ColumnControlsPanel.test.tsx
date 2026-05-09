import { render, screen, within, fireEvent } from "@testing-library/react";
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
    typeDisplay: "name",
    setTypeDisplay: vi.fn<SharedColumnState["setTypeDisplay"]>(),
    showTypeIcon: true,
    setShowTypeIcon: vi.fn<SharedColumnState["setShowTypeIcon"]>(),
    resetTypeDisplay: vi.fn<SharedColumnState["resetTypeDisplay"]>(),
    dayFormat: "day",
    setDayFormat: vi.fn<SharedColumnState["setDayFormat"]>(),
    resetDayFormat: vi.fn<SharedColumnState["resetDayFormat"]>(),
    ...overrides,
  };
}

function renderOpen(overrides: Partial<SharedColumnState> = {}): ReturnType<typeof render> {
  const result = render(<ColumnControlsPanel columnState={makeColumnState(overrides)} />);
  fireEvent.click(screen.getByRole("button", { name: /Customize columns/ }));
  return result;
}

test("renders four column groups matching EventDetail sections", () => {
  renderOpen();
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Players" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Logistics" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
});

test("Title toggle is inside the The Event group", () => {
  renderOpen();
  const group = screen.getByRole("group", { name: "The Event" });
  expect(within(group).getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
});

test("Min Players toggle is inside the Players group", () => {
  renderOpen();
  const group = screen.getByRole("group", { name: "Players" });
  expect(within(group).getByRole("checkbox", { name: "Min Players" })).toBeInTheDocument();
});

test("Duration toggle is inside the Logistics group", () => {
  renderOpen();
  const group = screen.getByRole("group", { name: "Logistics" });
  expect(within(group).getByRole("checkbox", { name: "Duration" })).toBeInTheDocument();
});

test("GMs toggle is inside the Contact group", () => {
  renderOpen();
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

test("renders Event type column fieldset", () => {
  renderOpen();
  expect(screen.getByRole("group", { name: "Event type column" })).toBeInTheDocument();
});

test("renders Show icon checkbox checked when showTypeIcon is true", () => {
  renderOpen({ showTypeIcon: true });
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("renders Show icon checkbox unchecked when showTypeIcon is false", () => {
  renderOpen({ showTypeIcon: false });
  expect(screen.getByRole("checkbox", { name: "Show icon" })).not.toBeChecked();
});

test("clicking Show icon checkbox calls setShowTypeIcon with toggled value", async () => {
  const user = userEvent.setup();
  const setShowTypeIcon = vi.fn<SharedColumnState["setShowTypeIcon"]>();
  renderOpen({ showTypeIcon: true, setShowTypeIcon });
  await user.click(screen.getByRole("checkbox", { name: "Show icon" }));
  expect(setShowTypeIcon).toHaveBeenCalledWith(false);
});

test("renders Code, Name, and Both radio buttons", () => {
  renderOpen();
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("Name radio is checked when typeDisplay is name", () => {
  renderOpen({ typeDisplay: "name" });
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Code" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Both" })).not.toBeChecked();
});

test("clicking Code radio calls setTypeDisplay with code", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<SharedColumnState["setTypeDisplay"]>();
  renderOpen({ typeDisplay: "name", setTypeDisplay });
  await user.click(screen.getByRole("radio", { name: "Code" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("code");
});

test("clicking Both radio calls setTypeDisplay with both", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<SharedColumnState["setTypeDisplay"]>();
  renderOpen({ typeDisplay: "name", setTypeDisplay });
  await user.click(screen.getByRole("radio", { name: "Both" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("both");
});

test("Reset to defaults calls resetTypeDisplay", async () => {
  const user = userEvent.setup();
  const resetTypeDisplay = vi.fn<SharedColumnState["resetTypeDisplay"]>();
  renderOpen({ resetTypeDisplay });
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(resetTypeDisplay).toHaveBeenCalledTimes(1);
});

test("renders Day column fieldset", () => {
  renderOpen();
  expect(screen.getByRole("group", { name: "Day column" })).toBeInTheDocument();
});

test("renders Day, MM/DD/YY, and Full date radio buttons", () => {
  renderOpen();
  expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Full date" })).toBeInTheDocument();
});

test("Day radio is checked when dayFormat is day", () => {
  renderOpen({ dayFormat: "day" });
  expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Full date" })).not.toBeChecked();
});

test("clicking MM/DD/YY radio calls setDayFormat with numeric", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<SharedColumnState["setDayFormat"]>();
  renderOpen({ dayFormat: "day", setDayFormat });
  await user.click(screen.getByRole("radio", { name: "MM/DD/YY" }));
  expect(setDayFormat).toHaveBeenCalledWith("numeric");
});

test("clicking Full date radio calls setDayFormat with long", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<SharedColumnState["setDayFormat"]>();
  renderOpen({ dayFormat: "day", setDayFormat });
  await user.click(screen.getByRole("radio", { name: "Full date" }));
  expect(setDayFormat).toHaveBeenCalledWith("long");
});

test("Reset to defaults calls resetDayFormat", async () => {
  const user = userEvent.setup();
  const resetDayFormat = vi.fn<SharedColumnState["resetDayFormat"]>();
  renderOpen({ resetDayFormat });
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(resetDayFormat).toHaveBeenCalledTimes(1);
});
