import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, it, describe } from "vitest";
import { SortDrawer } from "./SortDrawer";
import type { SortState } from "../../utils/types";

test("renders Sort trigger button", () => {
  render(
    <SortDrawer
      activeSort={[]}
      onSort={vi.fn<(sorts: SortState[]) => void>()}
      columnVisibility={{}}
      open={false}
      onOpenChange={vi.fn<(open: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
});

test("shows trigger badge count when active sorts exist", () => {
  render(
    <SortDrawer
      activeSort={[
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ]}
      onSort={vi.fn<(sorts: SortState[]) => void>()}
      columnVisibility={{}}
      open={false}
      onOpenChange={vi.fn<(open: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("button", { name: /Sort/ })).toHaveTextContent("Sort · 2");
});

describe("drawer content (open=true)", () => {
  it("shows 'No fields sorted' empty state when activeSort is empty", () => {
    render(
      <SortDrawer
        activeSort={[]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    expect(screen.getByText("No fields sorted")).toBeInTheDocument();
  });

  it("shows combobox label 'Pick fields to sort by'", () => {
    render(
      <SortDrawer
        activeSort={[]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    expect(screen.getByText("Pick fields to sort by")).toBeInTheDocument();
  });

  it("adding a field via combobox calls onSort with field appended as asc", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      <SortDrawer
        activeSort={[]}
        onSort={onSort}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Title" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "asc" }]);
  });

  it("already-sorted fields are not shown in the combobox", async () => {
    const user = userEvent.setup();
    render(
      <SortDrawer
        activeSort={[{ field: "title", dir: "asc" }]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("option", { name: "Title" })).not.toBeInTheDocument();
  });

  it("shows sort list rows for each active sort", () => {
    render(
      <SortDrawer
        activeSort={[
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
  });

  it("remove button calls onSort without that field", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      <SortDrawer
        activeSort={[
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ]}
        onSort={onSort}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove Title sort" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "cost", dir: "desc" }]);
  });

  it("asc/desc toggle button calls onSort with flipped direction", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      <SortDrawer
        activeSort={[{ field: "title", dir: "asc" }]}
        onSort={onSort}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Title: ascending, click to toggle" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
  });

  it("up arrow calls onSort with item moved earlier", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      <SortDrawer
        activeSort={[
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ]}
        onSort={onSort}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Cost up" }));
    expect(onSort).toHaveBeenCalledWith([
      { field: "cost", dir: "desc" },
      { field: "title", dir: "asc" },
    ]);
  });

  it("down arrow calls onSort with item moved later", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      <SortDrawer
        activeSort={[
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ]}
        onSort={onSort}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Title down" }));
    expect(onSort).toHaveBeenCalledWith([
      { field: "cost", dir: "desc" },
      { field: "title", dir: "asc" },
    ]);
  });

  it("up arrow is disabled for the first item", () => {
    render(
      <SortDrawer
        activeSort={[
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    expect(screen.getByRole("button", { name: "Move Title up" })).toBeDisabled();
  });

  it("down arrow is disabled for the last item", () => {
    render(
      <SortDrawer
        activeSort={[
          { field: "title", dir: "asc" },
          { field: "cost", dir: "desc" },
        ]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    expect(screen.getByRole("button", { name: "Move Cost down" })).toBeDisabled();
  });

  it("clear sorting button calls onSort with empty array", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    render(
      <SortDrawer
        activeSort={[{ field: "title", dir: "asc" }]}
        onSort={onSort}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear sorting" }));
    expect(onSort).toHaveBeenCalledWith([]);
  });

  it("clear sorting button is not shown when activeSort is empty", () => {
    render(
      <SortDrawer
        activeSort={[]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{}}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Clear sorting" })).not.toBeInTheDocument();
  });

  it("combobox shows Visible columns and Other fields groups when some columns are hidden", async () => {
    const user = userEvent.setup();
    render(
      <SortDrawer
        activeSort={[]}
        onSort={vi.fn<(sorts: SortState[]) => void>()}
        columnVisibility={{ gameSystem: false }}
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Visible columns")).toBeInTheDocument();
    expect(screen.getByText("Other fields")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Game System" })).toBeInTheDocument();
  });
});
