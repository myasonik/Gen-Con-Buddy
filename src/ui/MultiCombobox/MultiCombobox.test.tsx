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

test("custom renderChipContent is called with option and isOpen", () => {
  const renderChipContent = vi.fn<
    (option: MultiComboboxOption, isOpen: boolean) => React.ReactNode
  >(() => <span data-testid="custom-chip">custom</span>);
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
    expect.any(Boolean),
  );
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
