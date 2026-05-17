import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, it, describe } from "vitest";
import { SortDrawer } from "./SortDrawer";
import type { SortState } from "../../utils/types";

function makeDrawer(
  props: Partial<{
    activeSort: SortState[];
    onSort: (sorts: SortState[]) => void;
    columnVisibility: Record<string, boolean>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }> = {},
): React.ReactElement {
  return (
    <SortDrawer
      activeSort={props.activeSort ?? []}
      onSort={props.onSort ?? vi.fn<(sorts: SortState[]) => void>()}
      columnVisibility={props.columnVisibility ?? {}}
      open={props.open ?? false}
      onOpenChange={props.onOpenChange ?? vi.fn<(open: boolean) => void>()}
    />
  );
}

test("renders Sort trigger button", () => {
  render(makeDrawer());
  expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
});

test("shows trigger badge count when active sorts exist", () => {
  render(
    makeDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
    }),
  );
  expect(screen.getByRole("button", { name: /Sort/ })).toHaveTextContent("Sort · 2");
});

describe("drawer content (open=true)", () => {
  it("shows 'No fields sorted' empty state when activeSort is empty", () => {
    render(makeDrawer({ open: true }));
    expect(screen.getByText("No fields sorted")).toBeInTheDocument();
  });

  it("shows combobox label 'Pick fields to sort by'", () => {
    render(makeDrawer({ open: true }));
    expect(screen.getByText("Pick fields to sort by")).toBeInTheDocument();
  });

  it("shows Apply button when drawer is open", () => {
    render(makeDrawer({ open: true }));
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("adding a field stages it in the list without calling onSort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(makeDrawer({ open: true, onSort }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Title" }));
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(onSort).not.toHaveBeenCalled();
  });

  it("clicking Apply calls onSort with staged sort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(makeDrawer({ open: true, onSort }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Title" }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "asc" }]);
  });

  it("clicking Apply closes the drawer", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      makeDrawer({
        activeSort: [{ field: "title", dir: "asc" }],
        open: true,
        onOpenChange,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("already-sorted fields are not shown in the combobox", async () => {
    const user = userEvent.setup();
    render(makeDrawer({ activeSort: [{ field: "title", dir: "asc" }], open: true }));
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("option", { name: "Title" })).not.toBeInTheDocument();
  });

  it("shows sort list rows for each active sort", () => {
    render(
      makeDrawer({
        activeSort: [
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ],
        open: true,
      }),
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
  });

  it("remove button removes field from staged sort without calling onSort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      makeDrawer({
        activeSort: [
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ],
        open: true,
        onSort,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Remove Title sort" }));
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
    expect(onSort).not.toHaveBeenCalled();
  });

  it("asc/desc toggle updates staged direction without calling onSort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(makeDrawer({ activeSort: [{ field: "title", dir: "asc" }], open: true, onSort }));
    await user.click(screen.getByRole("button", { name: "Title: ascending, click to toggle" }));
    expect(
      screen.getByRole("button", { name: "Title: descending, click to toggle" }),
    ).toBeInTheDocument();
    expect(onSort).not.toHaveBeenCalled();
  });

  it("up arrow updates staged order without calling onSort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      makeDrawer({
        activeSort: [
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ],
        open: true,
        onSort,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Move Cost up" }));
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Cost");
    expect(items[1]).toHaveTextContent("Title");
    expect(onSort).not.toHaveBeenCalled();
  });

  it("down arrow updates staged order without calling onSort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      makeDrawer({
        activeSort: [
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ],
        open: true,
        onSort,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Move Title down" }));
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Cost");
    expect(items[1]).toHaveTextContent("Title");
    expect(onSort).not.toHaveBeenCalled();
  });

  it("up arrow is disabled for the first item", () => {
    render(
      makeDrawer({
        activeSort: [
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ],
        open: true,
      }),
    );
    expect(screen.getByRole("button", { name: "Move Title up" })).toBeDisabled();
  });

  it("down arrow is disabled for the last item", () => {
    render(
      makeDrawer({
        activeSort: [
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ],
        open: true,
      }),
    );
    expect(screen.getByRole("button", { name: "Move Cost down" })).toBeDisabled();
  });

  it("clear sorting clears staged sort without calling onSort", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(makeDrawer({ activeSort: [{ field: "title", dir: "asc" }], open: true, onSort }));
    await user.click(screen.getByRole("button", { name: "Clear sorting" }));
    expect(screen.getByText("No fields sorted")).toBeInTheDocument();
    expect(onSort).not.toHaveBeenCalled();
  });

  it("clear sorting button is not shown when activeSort is empty", () => {
    render(makeDrawer({ open: true }));
    expect(screen.queryByRole("button", { name: "Clear sorting" })).not.toBeInTheDocument();
  });

  it("combobox shows Visible columns and Other fields groups when some columns are hidden", async () => {
    const user = userEvent.setup();
    render(makeDrawer({ columnVisibility: { gameSystem: false }, open: true }));
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Visible columns")).toBeInTheDocument();
    expect(screen.getByText("Other fields")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Game System" })).toBeInTheDocument();
  });
});
