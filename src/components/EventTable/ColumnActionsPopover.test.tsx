import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import type { SortState } from "../../utils/types";

function renderPopover(
  overrides: Partial<React.ComponentProps<typeof ColumnActionsPopover>> = {},
): ReturnType<typeof render> {
  return render(
    <ColumnActionsPopover
      sortField="title"
      activeSort={[]}
      onSort={vi.fn<(sorts: SortState[]) => void>()}
      onOpenSortDrawer={vi.fn<() => void>()}
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

test("shows sort and resize actions when 0 sorts active", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Resize…" })).toBeInTheDocument();
});

test("shows sort and resize actions when 1 sort active on a different field", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "cost", dir: "asc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
});

test("shows 'Sort by this field…' when 2+ sorts active and field not sorted", async () => {
  const user = userEvent.setup();
  renderPopover({
    activeSort: [
      { field: "cost", dir: "asc" },
      { field: "startDateTime", dir: "asc" },
    ],
  });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort by this field…" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sort ascending" })).not.toBeInTheDocument();
});

test("'Sort by this field…' calls onOpenSortDrawer", async () => {
  const user = userEvent.setup();
  const onOpenSortDrawer = vi.fn<() => void>();
  renderPopover({
    activeSort: [
      { field: "cost", dir: "asc" },
      { field: "startDateTime", dir: "asc" },
    ],
    onOpenSortDrawer,
  });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort by this field…" }));
  expect(onOpenSortDrawer).toHaveBeenCalledTimes(1);
});

test("shows sort buttons and Remove sort when field is in activeSort", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove sort" })).toBeInTheDocument();
});

test("Sort ascending has aria-pressed=true when field is sorted asc", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Sort descending has aria-pressed=true when field is sorted desc", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "title", dir: "desc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort descending" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("clicking Sort ascending when unsorted calls onSort with field added", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "asc" }]);
});

test("clicking Sort descending when unsorted calls onSort with field added desc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
});

test("clicking Sort ascending when already asc calls onSort removing the field", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith([]);
});

test("clicking Sort descending when sorted asc calls onSort changing direction", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
});

test("clicking Remove sort calls onSort without that field", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({
    activeSort: [
      { field: "title", dir: "asc" },
      { field: "cost", dir: "desc" },
    ],
    onSort,
  });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Remove sort" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "cost", dir: "desc" }]);
});

test("clicking Resize… calls onOpenResize", async () => {
  const user = userEvent.setup();
  const onOpenResize = vi.fn<() => void>();
  renderPopover({ onOpenResize });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  expect(onOpenResize).toHaveBeenCalledTimes(1);
});

test("does not render sort buttons when sortField is undefined", async () => {
  const user = userEvent.setup();
  renderPopover({ sortField: undefined });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.queryByRole("button", { name: "Sort ascending" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sort by this field…" })).not.toBeInTheDocument();
});

test("renders formatControls inside the popup when provided", async () => {
  const user = userEvent.setup();
  renderPopover({ formatControls: <div>Format options</div> });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByText("Format options")).toBeInTheDocument();
});
