import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

test("renders label text", () => {
  render(<Checkbox checked={false} onCheckedChange={() => {}} label="Show title column" />);
  expect(screen.getByText("Show title column")).toBeInTheDocument();
});

test("checkbox is accessible as a checkbox role", () => {
  render(<Checkbox checked={false} onCheckedChange={() => {}} label="Show title column" />);
  expect(screen.getByRole("checkbox", { name: "Show title column" })).toBeInTheDocument();
});

test("is checked when checked prop is true", () => {
  render(<Checkbox checked onCheckedChange={() => {}} label="Show title column" />);
  expect(screen.getByRole("checkbox", { name: "Show title column" })).toBeChecked();
});

test("is unchecked when checked prop is false", () => {
  render(<Checkbox checked={false} onCheckedChange={() => {}} label="Show title column" />);
  expect(screen.getByRole("checkbox", { name: "Show title column" })).not.toBeChecked();
});

test("calls onCheckedChange with true when clicking unchecked checkbox", async () => {
  const user = userEvent.setup();
  const onCheckedChange = vi.fn<(checked: boolean) => void>();
  render(<Checkbox checked={false} onCheckedChange={onCheckedChange} label="Show title column" />);
  await user.click(screen.getByRole("checkbox", { name: "Show title column" }));
  expect(onCheckedChange).toHaveBeenCalledWith(true);
});

test("calls onCheckedChange with false when clicking checked checkbox", async () => {
  const user = userEvent.setup();
  const onCheckedChange = vi.fn<(checked: boolean) => void>();
  render(<Checkbox checked onCheckedChange={onCheckedChange} label="Show title column" />);
  await user.click(screen.getByRole("checkbox", { name: "Show title column" }));
  expect(onCheckedChange).toHaveBeenCalledWith(false);
});

test("keyboard accessible — space key toggles unchecked to checked", async () => {
  const user = userEvent.setup();
  const onCheckedChange = vi.fn<(checked: boolean) => void>();
  render(<Checkbox checked={false} onCheckedChange={onCheckedChange} label="Show title column" />);
  const checkbox = screen.getByRole("checkbox", { name: "Show title column" });
  checkbox.focus();
  await user.keyboard(" ");
  expect(onCheckedChange).toHaveBeenCalledWith(true);
});

test("renders custom indicator node when indicator prop is provided", () => {
  render(
    <Checkbox
      checked
      onCheckedChange={() => {}}
      label="Show title column"
      indicator={<span data-testid="custom-indicator" />}
    />,
  );
  expect(screen.getByTestId("custom-indicator")).toBeInTheDocument();
});
