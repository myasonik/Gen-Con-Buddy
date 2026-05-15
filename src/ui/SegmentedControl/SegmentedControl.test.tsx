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

// ─── menu variant ─────────────────────────────────────────────────────────────

test("menu variant renders options in a column (radiogroup has data-variant=menu)", () => {
  render(
    <SegmentedControl variant="menu" value="light" onValueChange={() => {}}>
      <SegmentedControl.Option value="light">Light</SegmentedControl.Option>
      <SegmentedControl.Option value="dark">Dark</SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByRole("radiogroup")).toHaveAttribute("data-variant", "menu");
});

test("menu variant renders all option labels", () => {
  render(
    <SegmentedControl variant="menu" value="light" onValueChange={() => {}}>
      <SegmentedControl.Option value="light">Light</SegmentedControl.Option>
      <SegmentedControl.Option value="dark">Dark</SegmentedControl.Option>
      <SegmentedControl.Option value="auto">Auto</SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeInTheDocument();
});

test("menu variant does not render indicator prop content", () => {
  render(
    <SegmentedControl variant="menu" value="light" onValueChange={() => {}}>
      <SegmentedControl.Option value="light" indicator={<span data-testid="should-not-appear" />}>
        Light
      </SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.queryByTestId("should-not-appear")).not.toBeInTheDocument();
});

test("menu variant selected option matches value prop", () => {
  render(
    <SegmentedControl variant="menu" value="dark" onValueChange={() => {}}>
      <SegmentedControl.Option value="light">Light</SegmentedControl.Option>
      <SegmentedControl.Option value="dark">Dark</SegmentedControl.Option>
    </SegmentedControl>,
  );
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeChecked();
  expect(screen.getByRole("radio", { name: /Light/i })).not.toBeChecked();
});

test("menu variant clicking an option calls onValueChange", async () => {
  const user = userEvent.setup();
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <SegmentedControl variant="menu" value="light" onValueChange={onValueChange}>
      <SegmentedControl.Option value="light">Light</SegmentedControl.Option>
      <SegmentedControl.Option value="dark">Dark</SegmentedControl.Option>
    </SegmentedControl>,
  );
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(onValueChange).toHaveBeenCalledWith("dark");
});
