import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ColumnResizeDialog } from "./ColumnResizeDialog";

test("renders with the column name in the heading", () => {
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Resize Title" }),
  ).toBeInTheDocument();
});

test("pre-fills the number input with currentWidth", () => {
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={200}
      onApply={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveValue(
    200,
  );
});

test("clicking Apply calls onApply with the parsed number value", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={onApply}
      onClose={vi.fn()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "300");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(300);
});

test("clicking Cancel calls onClose without calling onApply", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={onApply}
      onClose={onClose}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onApply).not.toHaveBeenCalled();
});
