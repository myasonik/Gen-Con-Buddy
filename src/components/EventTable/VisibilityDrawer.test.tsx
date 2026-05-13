import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, beforeEach } from "vitest";
import { VisibilityDrawer } from "./VisibilityDrawer";
import { COLUMNS } from "./columns";
import type { SharedColumnState } from "./types";

const { captureFn } = vi.hoisted(() => ({ captureFn: vi.fn<() => void>() }));
vi.mock("posthog-js/react", () => ({
  usePostHog: (): { capture: typeof captureFn } => ({ capture: captureFn }),
}));

beforeEach(() => {
  captureFn.mockClear();
});

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

test("renders Visibility trigger button", () => {
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
});

test("does not show column groups before the button is clicked", () => {
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});

test("opens drawer showing all four column groups on button click", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Players" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Logistics" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
});

test("Title checkbox is inside the The Event group", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  const group = screen.getByRole("group", { name: "The Event" });
  expect(within(group).getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
});

test("clicking a checkbox calls toggleVisibility with column id", async () => {
  const user = userEvent.setup();
  const toggleVisibility = vi.fn<SharedColumnState["toggleVisibility"]>();
  render(<VisibilityDrawer columnState={makeColumnState({ toggleVisibility })} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("checkbox", { name: "Title" }));
  expect(toggleVisibility).toHaveBeenCalledWith("title");
});

test("Reset button calls resetVisibility and resetSizing", async () => {
  const user = userEvent.setup();
  const resetVisibility = vi.fn<SharedColumnState["resetVisibility"]>();
  const resetSizing = vi.fn<SharedColumnState["resetSizing"]>();
  render(<VisibilityDrawer columnState={makeColumnState({ resetVisibility, resetSizing })} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetVisibility).toHaveBeenCalledTimes(1);
  expect(resetSizing).toHaveBeenCalledTimes(1);
});

test("Close button dismisses the drawer", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});

test("toggling a hidden column captures column_visibility_toggled with visible: true", async () => {
  const user = userEvent.setup();
  const visibility = { ...Object.fromEntries(COLUMNS.map((c) => [c.id, true])), cost: false };
  render(<VisibilityDrawer columnState={makeColumnState({ visibility })} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("checkbox", { name: "Cost" }));
  expect(captureFn).toHaveBeenCalledWith(
    "column_visibility_toggled",
    expect.objectContaining({ column_id: "cost", visible: true }),
  );
});

test("toggling a visible column captures column_visibility_toggled with visible: false", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("checkbox", { name: "Cost" }));
  expect(captureFn).toHaveBeenCalledWith(
    "column_visibility_toggled",
    expect.objectContaining({ column_id: "cost", visible: false }),
  );
});
