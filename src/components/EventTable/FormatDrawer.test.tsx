import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { FormatDrawer, TypeFormatControls, DayFormatControls } from "./FormatDrawer";
import type { SharedColumnState, TypeDisplay, DayFormat } from "./types";

function makeColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: {},
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

test("renders Format trigger button", () => {
  render(<FormatDrawer columnState={makeColumnState()} />);
  expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
});

test("does not show format groups before the button is clicked", () => {
  render(<FormatDrawer columnState={makeColumnState()} />);
  expect(screen.queryByRole("group", { name: "Event type column" })).not.toBeInTheDocument();
});

test("opens drawer showing Event type column and Day column fieldsets", async () => {
  const user = userEvent.setup();
  render(<FormatDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("group", { name: "Event type column" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Day column" })).toBeInTheDocument();
});

test("Reset button calls resetTypeDisplay and resetDayFormat", async () => {
  const user = userEvent.setup();
  const resetTypeDisplay = vi.fn<SharedColumnState["resetTypeDisplay"]>();
  const resetDayFormat = vi.fn<SharedColumnState["resetDayFormat"]>();
  render(<FormatDrawer columnState={makeColumnState({ resetTypeDisplay, resetDayFormat })} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetTypeDisplay).toHaveBeenCalledTimes(1);
  expect(resetDayFormat).toHaveBeenCalledTimes(1);
});

test("Close button dismisses the drawer", async () => {
  const user = userEvent.setup();
  render(<FormatDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("group", { name: "Event type column" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("group", { name: "Event type column" })).not.toBeInTheDocument();
});

test("TypeFormatControls renders Show icon checkbox checked when showTypeIcon is true", () => {
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("TypeFormatControls renders Show icon checkbox unchecked when showTypeIcon is false", () => {
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon={false}
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Show icon" })).not.toBeChecked();
});

test("TypeFormatControls clicking Show icon checkbox calls setShowTypeIcon with toggled value", async () => {
  const user = userEvent.setup();
  const setShowTypeIcon = vi.fn<(v: boolean) => void>();
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon
      setShowTypeIcon={setShowTypeIcon}
    />,
  );
  await user.click(screen.getByRole("checkbox", { name: "Show icon" }));
  expect(setShowTypeIcon).toHaveBeenCalledWith(false);
});

test("TypeFormatControls renders Code, Name, Both radio buttons", () => {
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("TypeFormatControls clicking Code radio calls setTypeDisplay with code", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<(v: TypeDisplay) => void>();
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={setTypeDisplay}
      showTypeIcon
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "Code" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("code");
});

test("TypeFormatControls clicking Both radio calls setTypeDisplay with both", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<(v: TypeDisplay) => void>();
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={setTypeDisplay}
      showTypeIcon
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "Both" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("both");
});

test("DayFormatControls renders Day, MM/DD/YY, Full date radio buttons", () => {
  render(<DayFormatControls dayFormat="day" setDayFormat={vi.fn<(v: DayFormat) => void>()} />);
  expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Full date" })).toBeInTheDocument();
});

test("DayFormatControls Day radio is checked when dayFormat is day", () => {
  render(<DayFormatControls dayFormat="day" setDayFormat={vi.fn<(v: DayFormat) => void>()} />);
  expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).not.toBeChecked();
});

test("DayFormatControls clicking MM/DD/YY radio calls setDayFormat with numeric", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<(v: DayFormat) => void>();
  render(<DayFormatControls dayFormat="day" setDayFormat={setDayFormat} />);
  await user.click(screen.getByRole("radio", { name: "MM/DD/YY" }));
  expect(setDayFormat).toHaveBeenCalledWith("numeric");
});

test("DayFormatControls clicking Full date radio calls setDayFormat with long", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<(v: DayFormat) => void>();
  render(<DayFormatControls dayFormat="day" setDayFormat={setDayFormat} />);
  await user.click(screen.getByRole("radio", { name: "Full date" }));
  expect(setDayFormat).toHaveBeenCalledWith("long");
});
