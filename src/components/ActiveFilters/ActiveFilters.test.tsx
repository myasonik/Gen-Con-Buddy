import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilters } from "./ActiveFilters";
import type { ActiveFilter } from "./getActiveFilters";

test("renders nothing when no filters are active", () => {
  const { container } = render(<ActiveFilters searchParams={{}} onRemove={() => {}} />);
  expect(container.firstChild).toBeNull();
});

test("renders nothing when only page/limit/sort are set", () => {
  const { container } = render(
    <ActiveFilters searchParams={{ page: 2, limit: 100, sort: "title.asc" }} onRemove={() => {}} />,
  );
  expect(container.firstChild).toBeNull();
});

test("renders a chip for each active filter", () => {
  render(
    <ActiveFilters searchParams={{ filter: "dragon", location: "Hall A" }} onRemove={() => {}} />,
  );
  expect(screen.getByText(/Search: dragon/)).toBeInTheDocument();
  expect(screen.getByText(/Location: Hall A/)).toBeInTheDocument();
});

test("each chip has a remove button and displays the label and × character", () => {
  render(<ActiveFilters searchParams={{ filter: "dragon" }} onRemove={() => {}} />);
  // The chip label is visible as text
  expect(screen.getByText(/Search: dragon/)).toBeInTheDocument();
  // The remove button is accessible
  const removeBtn = screen.getByRole("button", { name: /Remove Search: dragon/ });
  expect(removeBtn).toBeInTheDocument();
  expect(removeBtn).toHaveTextContent("×");
});

test("clicking a chip remove button calls onRemove with the filter object", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn<(filter: ActiveFilter) => void>();
  render(<ActiveFilters searchParams={{ filter: "dragon", days: "fri" }} onRemove={onRemove} />);
  await user.click(screen.getByRole("button", { name: /Remove Search: dragon/ }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  const [[filter]] = onRemove.mock.calls;
  expect(filter.id).toBe("filter");
  expect(filter.label).toBe("Search: dragon");
  expect(filter.remove({ filter: "dragon", days: "fri" })).toStrictEqual({
    days: "fri",
  });
});

test("clicking Fri chip remove calls onRemove with filter that leaves Sat", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn<(filter: ActiveFilter) => void>();
  render(<ActiveFilters searchParams={{ days: "fri,sat" }} onRemove={onRemove} />);
  expect(screen.getByText("Fri")).toBeInTheDocument();
  expect(screen.getByText("Sat")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove Fri" }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  const [[filter]] = onRemove.mock.calls;
  expect(filter.id).toBe("days:fri");
  expect(filter.remove({ days: "fri,sat" })).toStrictEqual({ days: "sat" });
});

test("renders a list with accessible label when filters are active", () => {
  render(<ActiveFilters searchParams={{ filter: "dragon" }} onRemove={() => {}} />);
  expect(screen.getByRole("list", { name: "Active filters" })).toBeInTheDocument();
});

test("renders icon before label when filter has an icon", () => {
  // tournament: "Yes" → Trophy icon wired in via getActiveFilters
  const { container } = render(
    <ActiveFilters
      searchParams={{ tournament: "Yes" }}
      onRemove={vi.fn<(filter: ActiveFilter) => void>()}
    />,
  );
  expect(container.querySelector("svg")).not.toBeNull();
  expect(screen.getByText(/Tournament: Yes/)).toBeInTheDocument();
});

test("renders no svg when filter has no icon", () => {
  // title has no icon assigned in FILTER_DEFS
  const { container } = render(
    <ActiveFilters
      searchParams={{ title: "dragon" }}
      onRemove={vi.fn<(filter: ActiveFilter) => void>()}
    />,
  );
  expect(container.querySelector("svg")).toBeNull();
});
