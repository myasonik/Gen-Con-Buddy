import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ColumnResizeDialog } from "./ColumnResizeDialog";

test("renders with the column name in the heading", () => {
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={vi.fn<(width: number) => void>()}
      onClose={vi.fn<() => void>()}
    />,
  );
  expect(screen.getByRole("heading", { name: "Resize Title" })).toBeInTheDocument();
});

test("pre-fills the number input with currentWidth", () => {
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={200}
      onApply={vi.fn<(width: number) => void>()}
      onClose={vi.fn<() => void>()}
    />,
  );
  expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveValue(200);
});

test("clicking Apply calls onApply with the parsed number value", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
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
  const onApply = vi.fn<(width: number) => void>();
  const onClose = vi.fn<() => void>();
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

test("number input has min attribute equal to minWidth", () => {
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      minWidth={80}
      onApply={vi.fn<(width: number) => void>()}
      onClose={vi.fn<() => void>()}
    />,
  );
  expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveAttribute("min", "80");
});

test("Apply clamps value to minWidth when input is below minimum", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      minWidth={80}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "50");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(80);
});

test("Apply passes value unchanged when it exceeds minWidth", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      minWidth={80}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "200");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(200);
});

test("works without minWidth prop (no clamping)", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "10");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(10);
});

test("pressing Escape calls onClose via onOpenChange", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn<() => void>();
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={vi.fn<(width: number) => void>()}
      onClose={onClose}
    />,
  );
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
});
