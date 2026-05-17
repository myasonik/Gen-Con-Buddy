import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MultiCombobox, type MultiComboboxOption } from "./MultiCombobox";

const OPTIONS = [
  { value: "alpha", label: "Alpha Option" },
  { value: "beta", label: "Beta Option" },
  { value: "gamma", label: "Gamma Option" },
];

test("renders label and combobox input", () => {
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);
  expect(screen.getByRole("combobox", { name: "Test Field" })).toBeInTheDocument();
});

test("shows no chips when value is empty", () => {
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);
  expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
});

test("shows chips for selected values using option labels", () => {
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={() => {}}
      options={OPTIONS}
    />,
  );
  expect(screen.getByRole("button", { name: "Remove Alpha Option" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove Beta Option" })).toBeInTheDocument();
});

test("chip remove button calls onValueChange without that value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Alpha Option" }));

  expect(handleChange).toHaveBeenCalledWith("beta");
});

test("clicking chip remove button does not open the dropdown", async () => {
  const user = userEvent.setup();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={() => {}}
      options={OPTIONS}
    />,
  );

  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Remove Alpha Option" }));

  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("backspace on empty input removes the last chip", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.keyboard("{Backspace}");

  expect(handleChange).toHaveBeenCalledWith("alpha");
});

test("type-to-filter narrows options", async () => {
  const user = userEvent.setup();
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.type(screen.getByRole("combobox", { name: "Test Field" }), "alpha");

  expect(screen.getByRole("option", { name: "Alpha Option" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Beta Option" })).not.toBeInTheDocument();
});

test("selecting an option calls onValueChange with that value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox label="Test Field" value="" onValueChange={handleChange} options={OPTIONS} />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.click(screen.getByRole("option", { name: "Beta Option" }));

  expect(handleChange).toHaveBeenCalledWith("beta");
});

test("selecting a second option appends to the value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.click(screen.getByRole("option", { name: "Beta Option" }));

  expect(handleChange).toHaveBeenCalledWith("alpha,beta");
});

test("selecting an already-selected option removes it", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.click(screen.getByRole("option", { name: "Beta Option" }));

  expect(handleChange).toHaveBeenCalledWith("alpha");
});

test("filter text is cleared when dropdown closes", async () => {
  const user = userEvent.setup();
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.type(screen.getByRole("combobox", { name: "Test Field" }), "alpha");
  expect(screen.queryByRole("option", { name: "Beta Option" })).not.toBeInTheDocument();

  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("combobox", { name: "Test Field" }));

  expect(screen.getByRole("option", { name: "Beta Option" })).toBeInTheDocument();
});

test("custom renderChipContent is called with option", () => {
  const renderChipContent = vi.fn<(option: MultiComboboxOption) => React.ReactNode>(() => (
    <span data-testid="custom-chip">custom</span>
  ));
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={() => {}}
      options={OPTIONS}
      renderChipContent={renderChipContent}
    />,
  );

  expect(screen.getByTestId("custom-chip")).toBeInTheDocument();
  expect(renderChipContent).toHaveBeenCalledWith(
    expect.objectContaining({ value: "alpha", label: "Alpha Option" }),
  );
});

test("expandedChipContent renders only when dropdown is open", async () => {
  const user = userEvent.setup();
  const expandedChipContent = vi.fn<(option: MultiComboboxOption) => React.ReactNode>(() => (
    <span data-testid="expanded">expanded</span>
  ));
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={() => {}}
      options={OPTIONS}
      expandedChipContent={expandedChipContent}
    />,
  );

  expect(screen.queryByTestId("expanded")).not.toBeInTheDocument();

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));

  expect(screen.getByTestId("expanded")).toBeInTheDocument();
});

test("custom renderOptionContent is rendered inside list items", async () => {
  const user = userEvent.setup();
  const renderOptionContent = vi.fn<(option: MultiComboboxOption) => React.ReactNode>(
    (opt: { value: string; label: string }) => (
      <span data-testid={`opt-${opt.value}`}>{opt.label}</span>
    ),
  );
  render(
    <MultiCombobox
      label="Test Field"
      value=""
      onValueChange={() => {}}
      options={OPTIONS}
      renderOptionContent={renderOptionContent}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));

  expect(screen.getByTestId("opt-alpha")).toBeInTheDocument();
  expect(screen.getByTestId("opt-beta")).toBeInTheDocument();
});

test("isLoading disables the combobox input", () => {
  render(
    <MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={[]} isLoading />,
  );

  expect(screen.getByRole("combobox", { name: "Test Field" })).toBeDisabled();
});

test("chips render raw value as label when option is not in options list", () => {
  render(
    <MultiCombobox
      label="Test Field"
      value="not-loaded-yet"
      onValueChange={() => {}}
      options={[]}
    />,
  );

  expect(screen.getByRole("button", { name: "Remove not-loaded-yet" })).toBeInTheDocument();
});

test("custom renderChipIcon is rendered via the chip icon slot", () => {
  const renderChipIcon = vi.fn<(option: MultiComboboxOption) => React.ReactNode>(() => (
    <svg data-testid="chip-icon" />
  ));
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={() => {}}
      options={OPTIONS}
      renderChipIcon={renderChipIcon}
    />,
  );

  expect(screen.getByTestId("chip-icon")).toBeInTheDocument();
  expect(renderChipIcon).toHaveBeenCalledWith(expect.objectContaining({ value: "alpha" }));
});

test("backspace with non-empty input does not remove the last chip", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.type(screen.getByRole("combobox", { name: "Test Field" }), "abc");
  await user.keyboard("{Backspace}");

  expect(handleChange).not.toHaveBeenCalled();
});

test("empty options list shows no-results message", async () => {
  const user = userEvent.setup();
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={[]} />);

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));

  expect(screen.getByText(/No results/)).toBeInTheDocument();
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
});

test("clicking the input group container focuses the combobox input", async () => {
  const user = userEvent.setup();
  render(
    <MultiCombobox label="Test Field" value="alpha" onValueChange={() => {}} options={OPTIONS} />,
  );

  const chipLabel = screen.getByText("Alpha Option");
  await user.click(chipLabel);

  expect(screen.getByRole("combobox", { name: "Test Field" })).toHaveFocus();
});

test("chip-input row wrapper is present whether or not chips are selected", () => {
  const { rerender } = render(
    <MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />,
  );
  expect(screen.getByTestId("chip-input-row")).toBeInTheDocument();

  rerender(
    <MultiCombobox label="Test Field" value="alpha" onValueChange={() => {}} options={OPTIONS} />,
  );
  expect(screen.getByTestId("chip-input-row")).toBeInTheDocument();
  expect(screen.getByTestId("chip-input-row")).toContainElement(
    screen.getByRole("combobox", { name: "Test Field" }),
  );
});

test("two mounted MultiCombobox instances have distinct input ids", () => {
  render(
    <>
      <MultiCombobox label="First" value="" onValueChange={() => {}} options={OPTIONS} />
      <MultiCombobox label="Second" value="" onValueChange={() => {}} options={OPTIONS} />
    </>,
  );
  const inputs = screen.getAllByRole("combobox");
  expect(inputs[0].id).not.toBe("");
  expect(inputs[1].id).not.toBe("");
  expect(inputs[0].id).not.toBe(inputs[1].id);
});

test("chip remove buttons are reachable via Tab", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">Before</button>
      <MultiCombobox
        label="Test Field"
        value="alpha,beta"
        onValueChange={() => {}}
        options={OPTIONS}
      />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "Before" }));
  await user.tab();
  expect(screen.getByRole("button", { name: "Remove Alpha Option" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Remove Beta Option" })).toHaveFocus();
});

test("trailing comma in value does not render an empty chip", () => {
  render(
    <MultiCombobox
      label="Test"
      value="RPG,"
      onValueChange={() => {}}
      options={[{ value: "RPG", label: "Roleplaying Game" }]}
    />,
  );
  expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Remove Roleplaying Game" })).toBeInTheDocument();
});
