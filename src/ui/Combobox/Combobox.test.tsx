import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { Combobox, type ComboboxGroup } from "./Combobox";

const ALL_VISIBLE: ComboboxGroup[] = [
  {
    label: "Group A",
    options: [
      { value: "title", label: "Title" },
      { value: "cost", label: "Cost" },
    ],
  },
];

const TWO_GROUPS: ComboboxGroup[] = [
  {
    label: "Visible columns",
    options: [
      { value: "title", label: "Title" },
      { value: "cost", label: "Cost" },
    ],
  },
  {
    label: "Other fields",
    options: [{ value: "location", label: "Location" }],
  },
];

test("renders the label", () => {
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  expect(screen.getByText("Sort by")).toBeInTheDocument();
});

test("shows all options when opened", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  expect(screen.getByRole("option", { name: "Title" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Cost" })).toBeInTheDocument();
});

test("typing filters options", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "ti");
  expect(screen.getByRole("option", { name: "Title" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Cost" })).not.toBeInTheDocument();
});

test("calls onSelect with the value when an option is clicked", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn<(value: string) => void>();
  render(<Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={onSelect} />);
  await user.click(screen.getByRole("combobox"));
  await user.click(screen.getByRole("option", { name: "Title" }));
  expect(onSelect).toHaveBeenCalledWith("title");
});

test("input is cleared after selection", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  await user.click(screen.getByRole("option", { name: "Title" }));
  expect(screen.getByRole("combobox")).toHaveValue("");
});

test("dropdown does not reopen after selection", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  await user.click(screen.getByRole("option", { name: "Title" }));
  expect(screen.queryByRole("option", { name: "Cost" })).not.toBeInTheDocument();
});

test("shows No results when filter matches nothing", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "zzz");
  expect(screen.getByText("No results")).toBeInTheDocument();
});

test("shows group labels when multiple groups have options", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={TWO_GROUPS} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  expect(screen.getByText("Visible columns")).toBeInTheDocument();
  expect(screen.getByText("Other fields")).toBeInTheDocument();
});

test("hides group labels when filter collapses to one group", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={TWO_GROUPS} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "loc");
  expect(screen.queryByText("Visible columns")).not.toBeInTheDocument();
  expect(screen.queryByText("Other fields")).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Location" })).toBeInTheDocument();
});

test("does not show group labels when only one group is passed", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  expect(screen.queryByText("Group A")).not.toBeInTheDocument();
});

test("closes dropdown when focus moves away (tab out)", async () => {
  const user = userEvent.setup();
  render(
    <Combobox label="Sort by" groups={ALL_VISIBLE} onSelect={vi.fn<(value: string) => void>()} />,
  );
  await user.click(screen.getByRole("combobox"));
  expect(screen.getByRole("option", { name: "Title" })).toBeInTheDocument();
  await user.tab();
  expect(screen.queryByRole("option", { name: "Title" })).not.toBeInTheDocument();
});
