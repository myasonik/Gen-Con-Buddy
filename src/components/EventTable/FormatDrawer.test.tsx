import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import {
  FormatDrawer,
  TypeFormatControls,
  DayFormatControls,
  TimeFormatControls,
  TimeHourControls,
} from "./FormatDrawer";
import type { SharedColumnState, TypeDisplay, DayFormat, TimeZone, TimeFormat } from "./types";

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
    timeZone: "indy",
    setTimeZone: vi.fn<SharedColumnState["setTimeZone"]>(),
    resetTimeZone: vi.fn<SharedColumnState["resetTimeZone"]>(),
    timeFormat: "auto",
    setTimeFormat: vi.fn<SharedColumnState["setTimeFormat"]>(),
    resetTimeFormat: vi.fn<SharedColumnState["resetTimeFormat"]>(),
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

test("opens drawer showing Time columns fieldset", async () => {
  const user = userEvent.setup();
  render(<FormatDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("group", { name: "Time columns" })).toBeInTheDocument();
});

test("Reset button also calls resetTimeZone", async () => {
  const user = userEvent.setup();
  const resetTimeZone = vi.fn<SharedColumnState["resetTimeZone"]>();
  render(<FormatDrawer columnState={makeColumnState({ resetTimeZone })} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetTimeZone).toHaveBeenCalledTimes(1);
});

test("TimeFormatControls renders Indianapolis and Local radio buttons", () => {
  render(<TimeFormatControls timeZone="indy" setTimeZone={vi.fn<(v: TimeZone) => void>()} />);
  expect(screen.getByRole("radio", { name: "Indianapolis" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Local" })).toBeInTheDocument();
});

test("TimeFormatControls Indianapolis radio is checked when timeZone is indy", () => {
  render(<TimeFormatControls timeZone="indy" setTimeZone={vi.fn<(v: TimeZone) => void>()} />);
  expect(screen.getByRole("radio", { name: "Indianapolis" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Local" })).not.toBeChecked();
});

test("TimeFormatControls clicking Local radio calls setTimeZone with local", async () => {
  const user = userEvent.setup();
  const setTimeZone = vi.fn<(v: TimeZone) => void>();
  render(<TimeFormatControls timeZone="indy" setTimeZone={setTimeZone} />);
  await user.click(screen.getByRole("radio", { name: "Local" }));
  expect(setTimeZone).toHaveBeenCalledWith("local");
});

test("TimeFormatControls clicking Indianapolis radio calls setTimeZone with indy", async () => {
  const user = userEvent.setup();
  const setTimeZone = vi.fn<(v: TimeZone) => void>();
  render(<TimeFormatControls timeZone="local" setTimeZone={setTimeZone} />);
  await user.click(screen.getByRole("radio", { name: "Indianapolis" }));
  expect(setTimeZone).toHaveBeenCalledWith("indy");
});

test("TimeHourControls renders Auto, 12h, 24h radio buttons", () => {
  render(<TimeHourControls timeFormat="auto" setTimeFormat={vi.fn<(v: TimeFormat) => void>()} />);
  expect(screen.getByRole("radio", { name: "Auto" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "12h" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "24h" })).toBeInTheDocument();
});

test("TimeHourControls Auto radio is checked when timeFormat is auto", () => {
  render(<TimeHourControls timeFormat="auto" setTimeFormat={vi.fn<(v: TimeFormat) => void>()} />);
  expect(screen.getByRole("radio", { name: "Auto" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "24h" })).not.toBeChecked();
});

test("TimeHourControls clicking 24h radio calls setTimeFormat with 24h", async () => {
  const user = userEvent.setup();
  const setTimeFormat = vi.fn<(v: TimeFormat) => void>();
  render(<TimeHourControls timeFormat="auto" setTimeFormat={setTimeFormat} />);
  await user.click(screen.getByRole("radio", { name: "24h" }));
  expect(setTimeFormat).toHaveBeenCalledWith("24h");
});

test("TimeHourControls clicking 12h radio calls setTimeFormat with 12h", async () => {
  const user = userEvent.setup();
  const setTimeFormat = vi.fn<(v: TimeFormat) => void>();
  render(<TimeHourControls timeFormat="auto" setTimeFormat={setTimeFormat} />);
  await user.click(screen.getByRole("radio", { name: "12h" }));
  expect(setTimeFormat).toHaveBeenCalledWith("12h");
});

test("Reset button also calls resetTimeFormat", async () => {
  const user = userEvent.setup();
  const resetTimeFormat = vi.fn<SharedColumnState["resetTimeFormat"]>();
  render(<FormatDrawer columnState={makeColumnState({ resetTimeFormat })} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetTimeFormat).toHaveBeenCalledTimes(1);
});
