import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "./SegmentedControl";

test("renders all option labels", () => {
  render(
    <SegmentedControl value="code" onValueChange={() => {}}>
      <SegmentedControl.Option value="code">Code</SegmentedControl.Option>
      <SegmentedControl.Option value="name">Name</SegmentedControl.Option>
      <SegmentedControl.Option value="both">Both</SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("selected option matches value prop", () => {
  render(
    <SegmentedControl value="name" onValueChange={() => {}}>
      <SegmentedControl.Option value="code">Code</SegmentedControl.Option>
      <SegmentedControl.Option value="name">Name</SegmentedControl.Option>
      <SegmentedControl.Option value="both">Both</SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Code" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Both" })).not.toBeChecked();
});

test("clicking an option calls onValueChange with its value", async () => {
  const user = userEvent.setup();
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <SegmentedControl value="code" onValueChange={onValueChange}>
      <SegmentedControl.Option value="code">Code</SegmentedControl.Option>
      <SegmentedControl.Option value="name">Name</SegmentedControl.Option>
      <SegmentedControl.Option value="both">Both</SegmentedControl.Option>
    </SegmentedControl>,
  );
  await user.click(screen.getByRole("radio", { name: "Name" }));
  expect(onValueChange).toHaveBeenCalledWith("name");
});

test("clicking a different option updates selection", async () => {
  const user = userEvent.setup();
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <SegmentedControl value="code" onValueChange={onValueChange}>
      <SegmentedControl.Option value="code">Code</SegmentedControl.Option>
      <SegmentedControl.Option value="name">Name</SegmentedControl.Option>
    </SegmentedControl>,
  );
  await user.click(screen.getByRole("radio", { name: "Name" }));
  expect(onValueChange).toHaveBeenCalledWith("name");
});

test("renders as radiogroup role", () => {
  render(
    <SegmentedControl value="code" onValueChange={() => {}}>
      <SegmentedControl.Option value="code">Code</SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByRole("radiogroup")).toBeInTheDocument();
});

test("renders indicator when indicator prop is provided", () => {
  render(
    <SegmentedControl value="code" onValueChange={() => {}}>
      <SegmentedControl.Option value="code" indicator={<span data-testid="indicator" />}>
        Code
      </SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByTestId("indicator")).toBeInTheDocument();
});

test("keyboard accessible — arrow key navigates between options and calls onValueChange", async () => {
  const user = userEvent.setup();
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <SegmentedControl value="code" onValueChange={onValueChange}>
      <SegmentedControl.Option value="code">Code</SegmentedControl.Option>
      <SegmentedControl.Option value="name">Name</SegmentedControl.Option>
      <SegmentedControl.Option value="both">Both</SegmentedControl.Option>
    </SegmentedControl>,
  );
  screen.getByRole("radio", { name: "Code" }).focus();
  await user.keyboard("{ArrowDown}");
  expect(onValueChange).toHaveBeenCalledWith("name");
});
