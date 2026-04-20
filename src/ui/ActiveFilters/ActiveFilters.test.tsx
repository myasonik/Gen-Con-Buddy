import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilters } from "./ActiveFilters";
import type { SearchParams } from "../../utils/types";

test("renders nothing when no filters are active", () => {
  const { container } = render(
    <ActiveFilters searchParams={{}} onRemove={() => {}} />,
  );
  expect(container.firstChild).toBeNull();
});

test("renders nothing when only page/limit/sort are set", () => {
  const { container } = render(
    <ActiveFilters
      searchParams={{ page: 2, limit: 100, sort: "title.asc" }}
      onRemove={() => {}}
    />,
  );
  expect(container.firstChild).toBeNull();
});

test("renders a chip for each active filter", () => {
  render(
    <ActiveFilters
      searchParams={{ filter: "dragon", location: "Hall A" }}
      onRemove={() => {}}
    />,
  );
  expect(
    screen.getByRole("button", { name: /Search: dragon/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Location: Hall A/ }),
  ).toBeInTheDocument();
});

test("each chip is a button containing the label and × character", () => {
  render(
    <ActiveFilters searchParams={{ filter: "dragon" }} onRemove={() => {}} />,
  );
  const chip = screen.getByRole("button", { name: /Search: dragon/ });
  expect(chip).toHaveTextContent("Search: dragon");
  expect(chip).toHaveTextContent("×");
});

test("clicking a chip calls onRemove with the correct key", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters
      searchParams={{ filter: "dragon", days: "fri" }}
      onRemove={onRemove}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Search: dragon/ }));
  expect(onRemove).toHaveBeenCalledWith("filter");
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test("clicking days chip calls onRemove with 'days'", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters searchParams={{ days: "fri,sat" }} onRemove={onRemove} />,
  );
  await user.click(screen.getByRole("button", { name: /Days: Fri, Sat/ }));
  expect(onRemove).toHaveBeenCalledWith("days");
});

test("renders a list with accessible label when filters are active", () => {
  render(
    <ActiveFilters searchParams={{ filter: "dragon" }} onRemove={() => {}} />,
  );
  expect(
    screen.getByRole("list", { name: "Active filters" }),
  ).toBeInTheDocument();
});
