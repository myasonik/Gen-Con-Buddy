import { vi, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "./SearchForm";
import type { SearchFormValues } from "../../utils/types";

const noop = (): undefined => undefined;

test("renders the top-level filter and event type fields", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Event Type" })).toBeInTheDocument();
});

test("renders the Search and Reset buttons", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "▶ Search" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "↺ Reset" })).toBeInTheDocument();
});

test("renders advanced filter fields inside a disclosure", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Game ID" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Location" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Materials Required Details" })).toBeInTheDocument();
});

test("Tournament and Materials Required render as select dropdowns", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("combobox", { name: "Tournament" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Materials Required" })).toBeInTheDocument();
});

test("selecting Yes for Tournament submits correct value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.selectOptions(screen.getByRole("combobox", { name: "Tournament" }), "Yes");
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].tournament).toBe("Yes");
});

test("selecting Yes for Materials Required submits correct value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.selectOptions(screen.getByRole("combobox", { name: "Materials Required" }), "Yes");
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].materialsRequired).toBe("Yes");
});

test("populates fields from values", () => {
  render(<SearchForm values={{ title: "Dungeon Crawl" }} onSearch={noop} />);
  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Dungeon Crawl");
});

test("submits with the title value passed to onSearch", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.type(screen.getByRole("textbox", { name: "Title" }), "Dragons");
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch).toHaveBeenCalledTimes(1);
  expect(handleSearch.mock.calls[0][0]).toMatchObject({ title: "Dragons" });
});

test("submits with the filter (full text search) value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.type(screen.getByRole("textbox", { name: "Search" }), "fire");
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0]).toMatchObject({ filter: "fire" });
});

test("reset button clears all form fields", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ title: "Dungeon Crawl", filter: "dragon" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "↺ Reset" }));

  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("");
  expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
});

test("picks up new values when values prop changes", () => {
  const { rerender } = render(<SearchForm values={{ eventType: "BGM" }} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();

  rerender(<SearchForm values={{ eventType: "RPG" }} onSearch={noop} />);

  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove BGM" })).not.toBeInTheDocument();
});

const DAYS = ["Wed", "Thu", "Fri", "Sat", "Sun"] as const;

test("renders day filters as checkboxes in the DAYS fieldset", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeInTheDocument();
  }
});

test("checking a day checkbox submits the correct days value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Thu" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("thu");
});

test("checking multiple day checkboxes submits comma-separated days", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Wed" }));
  await user.click(screen.getByRole("checkbox", { name: "Sun" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("wed,sun");
});

test("populates day checkboxes from values prop", () => {
  render(<SearchForm values={{ days: "fri,sat" }} onSearch={noop} />);
  expect(screen.getByRole("checkbox", { name: "Fri" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Sat" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Wed" })).not.toBeChecked();
});

test("reset button clears day checkboxes", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "↺ Reset" }));

  expect(screen.getByRole("checkbox", { name: "Thu" })).not.toBeChecked();
});

test("day checkboxes are disabled when startDateTimeStart has a value", () => {
  render(<SearchForm values={{ startDateTimeStart: "2024-08-01T10:00" }} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeDisabled();
  }
});

test("day checkboxes are disabled when startDateTimeEnd has a value", () => {
  render(<SearchForm values={{ startDateTimeEnd: "2024-08-01T14:00" }} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeDisabled();
  }
});

test("start date inputs are disabled when any day is checked", () => {
  const { container } = render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);
  expect(
    container.querySelector<HTMLInputElement>('input[name="startDateTimeStart"]'),
  ).toBeDisabled();
  expect(
    container.querySelector<HTMLInputElement>('input[name="startDateTimeEnd"]'),
  ).toBeDisabled();
});

test("end date inputs are disabled when any day is checked", () => {
  const { container } = render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);
  expect(
    container.querySelector<HTMLInputElement>('input[name="endDateTimeStart"]'),
  ).toBeDisabled();
  expect(container.querySelector<HTMLInputElement>('input[name="endDateTimeEnd"]')).toBeDisabled();
});

test("toggletip appears next to day checkboxes when they are disabled", () => {
  render(<SearchForm values={{ startDateTimeStart: "2024-08-01T10:00" }} onSearch={noop} />);
  expect(screen.getByRole("button", { name: /why.*day/i })).toBeInTheDocument();
});

test("toggletip appears next to start date fields when they are disabled", () => {
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);
  expect(screen.getByRole("button", { name: /why.*start date/i })).toBeInTheDocument();
});

test("toggletip appears next to end date fields when they are disabled", () => {
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);
  expect(screen.getByRole("button", { name: /why.*end date/i })).toBeInTheDocument();
});

test("toggletip message for disabled day checkboxes explains to clear start date", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ startDateTimeStart: "2024-08-01T10:00" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: /why.*day/i }));

  expect(screen.getByText(/clear the start date fields/i)).toBeInTheDocument();
});

test("toggletip message for disabled start date explains to clear day checkboxes", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: /why.*start date/i }));

  expect(screen.getByText(/clear the day checkboxes/i)).toBeInTheDocument();
});

test("duration inputs use 0.5-hour steps to match real event data", () => {
  const { container } = render(<SearchForm values={{}} onSearch={noop} />);
  expect(container.querySelector('input[name="durationMin"]')).toHaveAttribute("step", "0.5");
  expect(container.querySelector('input[name="durationMax"]')).toHaveAttribute("step", "0.5");
});
