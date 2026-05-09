import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ColumnActionsPopover } from "./ColumnActionsPopover";

function renderPopover(
  overrides: Partial<React.ComponentProps<typeof ColumnActionsPopover>> = {},
): ReturnType<typeof render> {
  return render(
    <ColumnActionsPopover
      sortField="title"
      activeSortField={undefined}
      activeSortDir={undefined}
      onSort={vi.fn<(sort: string | undefined) => void>()}
      onOpenResize={vi.fn<() => void>()}
      formatControls={undefined}
      {...overrides}
    />,
  );
}

test("renders a column actions button", () => {
  renderPopover();
  expect(screen.getByRole("button", { name: "Column actions" })).toBeInTheDocument();
});

test("opens popover with sort and resize actions when clicked", async () => {
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Resize…" })).toBeInTheDocument();
});

test("sort ascending has aria-pressed=false when column is unsorted", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSortField: undefined });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("sort ascending has aria-pressed=true when column is sorted ascending", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSortField: "title", activeSortDir: "asc" });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("sort descending has aria-pressed=true when column is sorted descending", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSortField: "title", activeSortDir: "desc" });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort descending" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("clicking Sort ascending when unsorted calls onSort with field.asc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sort: string | undefined) => void>();
  renderPopover({ onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith("title.asc");
});

test("clicking Sort ascending when already ascending calls onSort with undefined", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sort: string | undefined) => void>();
  renderPopover({ activeSortField: "title", activeSortDir: "asc", onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith(undefined);
});

test("clicking Sort descending when ascending calls onSort with field.desc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sort: string | undefined) => void>();
  renderPopover({ activeSortField: "title", activeSortDir: "asc", onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith("title.desc");
});

test("clicking Resize… calls onOpenResize", async () => {
  const user = userEvent.setup();
  const onOpenResize = vi.fn<() => void>();
  renderPopover({ onOpenResize });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  expect(onOpenResize).toHaveBeenCalledTimes(1);
});

test("clicking Sort descending when already descending calls onSort with undefined", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sort: string | undefined) => void>();
  renderPopover({ activeSortField: "title", activeSortDir: "desc", onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith(undefined);
});

test("does not render sort buttons when sortField is undefined", async () => {
  const user = userEvent.setup();
  renderPopover({ sortField: undefined });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.queryByRole("button", { name: "Sort ascending" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sort descending" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Resize…" })).toBeInTheDocument();
});

test("renders formatControls inside the popup when provided", async () => {
  const user = userEvent.setup();
  renderPopover({ formatControls: <div>Format options</div> });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByText("Format options")).toBeInTheDocument();
});

test("does not render extra content when formatControls is absent", async () => {
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.queryByText("Format options")).not.toBeInTheDocument();
});
