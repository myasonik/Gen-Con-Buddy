import { vi, test, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "./SearchForm";
import type { SearchFormValues } from "../../utils/types";

const noop = (): undefined => undefined;

test("renders the keyword search field", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
});

test("renders the event type combobox", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("combobox", { name: "Event Type" })).toBeInTheDocument();
});

test("renders the Search and Reset buttons", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
});

test("renders the Filters button to open the advanced drawer", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
});

test("renders advanced filter fields in the form", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Game ID" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Location" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Materials Required Details" })).toBeInTheDocument();
});

test("Tournament and Materials Required render as select dropdowns", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("combobox", { name: "Tournament" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Materials Required" })).toBeInTheDocument();
});

test("selecting Yes for Tournament submits correct value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Tournament" }), "Yes");
  await user.click(screen.getByRole("button", { name: "Close" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0].tournament).toBe("Yes");
});

test("selecting Yes for Materials Required submits correct value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Materials Required" }), "Yes");
  await user.click(screen.getByRole("button", { name: "Close" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0].materialsRequired).toBe("Yes");
});

test("populates fields from values", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ title: "Dungeon Crawl" }} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Dungeon Crawl");
});

test("submits with the title value passed to onSearch", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.type(screen.getByRole("textbox", { name: "Title" }), "Dragons");
  await user.click(screen.getByRole("button", { name: "Close" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch).toHaveBeenCalledTimes(1);
  expect(handleSearch.mock.calls[0][0]).toMatchObject({ title: "Dragons" });
});

test("submits with the filter (full text search) value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.type(screen.getByRole("textbox", { name: "Search" }), "fire");
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0]).toMatchObject({ filter: "fire" });
});

test("reset button clears all form fields", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ title: "Dungeon Crawl", filter: "dragon" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "Reset" }));

  expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("");
});

test("picks up new values when values prop changes", () => {
  const { rerender } = render(<SearchForm values={{ eventType: "BGM" }} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();

  rerender(<SearchForm values={{ eventType: "RPG" }} onSearch={noop} />);

  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove BGM" })).not.toBeInTheDocument();
});

const DAYS = ["Wed", "Thu", "Fri", "Sat", "Sun"] as const;

test("renders day filters as checkboxes", () => {
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
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("thu");
});

test("checking multiple day checkboxes submits comma-separated days", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Wed" }));
  await user.click(screen.getByRole("checkbox", { name: "Sun" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

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

  await user.click(screen.getByRole("button", { name: "Reset" }));

  expect(screen.getByRole("checkbox", { name: "Thu" })).not.toBeChecked();
});

test("renders time range inputs in the strip", () => {
  const { container } = render(<SearchForm values={{}} onSearch={noop} />);
  expect(container.querySelector('input[name="timeStart"]')).toBeInTheDocument();
  expect(container.querySelector('input[name="timeEnd"]')).toBeInTheDocument();
});

test("time inputs use 30-minute steps", () => {
  const { container } = render(<SearchForm values={{}} onSearch={noop} />);
  expect(container.querySelector('input[name="timeStart"]')).toHaveAttribute("step", "1800");
  expect(container.querySelector('input[name="timeEnd"]')).toHaveAttribute("step", "1800");
});

test("populates time inputs from values prop", () => {
  const { container } = render(
    <SearchForm values={{ timeStart: "09:00", timeEnd: "17:00" }} onSearch={noop} />,
  );
  expect(container.querySelector<HTMLInputElement>('input[name="timeStart"]')?.value).toBe("09:00");
  expect(container.querySelector<HTMLInputElement>('input[name="timeEnd"]')?.value).toBe("17:00");
});

test("submits timeStart and timeEnd values", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{ timeStart: "09:00", timeEnd: "17:00" }} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0].timeStart).toBe("09:00");
  expect(handleSearch.mock.calls[0][0].timeEnd).toBe("17:00");
});

test("reset button clears time inputs", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <SearchForm values={{ timeStart: "09:00", timeEnd: "17:00" }} onSearch={noop} />,
  );

  await user.click(screen.getByRole("button", { name: "Reset" }));

  expect(container.querySelector<HTMLInputElement>('input[name="timeStart"]')?.value).toBe("");
  expect(container.querySelector<HTMLInputElement>('input[name="timeEnd"]')?.value).toBe("");
});

test("duration inputs use 0.5-hour steps to match real event data", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  const durationGroup = screen.getByRole("group", { name: "Duration" });
  const [fromInput, toInput] = within(durationGroup).getAllByRole("spinbutton");
  expect(fromInput).toHaveAttribute("step", "0.5");
  expect(toInput).toHaveAttribute("step", "0.5");
});

test("Filters button has aria-haspopup=dialog", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute(
    "aria-haspopup",
    "dialog",
  );
});

test("filters drawer has role=dialog with accessible name when open", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
});

test("Escape key closes the filters dialog", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});

test("clicking outside the dialog closes the filters dialog", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
  await user.click(document.body);
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});

test("clicking the close button closes the filters dialog", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});

test("renders an Apply Filters button in the drawer", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(
    within(screen.getByRole("dialog", { name: "Advanced Filters" })).getByRole("button", {
      name: "Apply Filters",
    }),
  ).toBeInTheDocument();
});

test("clicking Apply Filters submits form values and closes the drawer", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.type(screen.getByRole("textbox", { name: "Title" }), "Dragons");
  await user.click(
    within(screen.getByRole("dialog", { name: "Advanced Filters" })).getByRole("button", {
      name: "Apply Filters",
    }),
  );

  expect(handleSearch).toHaveBeenCalledTimes(1);
  expect(handleSearch.mock.calls[0][0]).toMatchObject({ title: "Dragons" });
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});
