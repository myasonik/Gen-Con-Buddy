import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { Pagination } from "./Pagination";

test("prev button is disabled on page 1", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={300}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
});

test("next button is disabled on last page", () => {
  render(
    <Pagination
      page={3}
      limit={100}
      total={300}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("clicking Prev calls onNavigate with page - 1", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn<(page: number, limit: number) => void>();
  render(<Pagination page={3} limit={100} total={500} onNavigate={onNavigate} />);
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(onNavigate).toHaveBeenCalledWith(2, 100);
});

test("clicking Next calls onNavigate with page + 1", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn<(page: number, limit: number) => void>();
  render(<Pagination page={2} limit={100} total={500} onNavigate={onNavigate} />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onNavigate).toHaveBeenCalledWith(3, 100);
});

test("clicking a page number calls onNavigate with that page", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn<(page: number, limit: number) => void>();
  render(<Pagination page={1} limit={100} total={300} onNavigate={onNavigate} />);
  await user.click(screen.getByRole("button", { name: "3" }));
  expect(onNavigate).toHaveBeenCalledWith(3, 100);
});

test("shows all pages when totalPages <= 7", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={700}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  [1, 2, 3, 4, 5, 6, 7].forEach((n) => {
    expect(screen.getByRole("button", { name: String(n) })).toBeInTheDocument();
  });
  expect(screen.queryByText("…")).not.toBeInTheDocument();
});

test("shows ellipsis for large page ranges", () => {
  render(
    <Pagination
      page={5}
      limit={100}
      total={2000}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  const ellipses = screen.getAllByText("…");
  expect(ellipses.length).toBeGreaterThanOrEqual(1);
  expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "20" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
});

test("changing page size calls onNavigate with page 1 and new limit", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn<(page: number, limit: number) => void>();
  render(<Pagination page={3} limit={100} total={500} onNavigate={onNavigate} />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Per page" }), "500");
  expect(onNavigate).toHaveBeenCalledWith(1, 500);
});

test("page size select shows current limit", () => {
  render(
    <Pagination
      page={1}
      limit={500}
      total={1000}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(screen.getByRole("combobox", { name: "Per page" })).toHaveTextContent("500");
});

test("caps page count at 10,000-result backend limit", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={50000}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(screen.getByRole("button", { name: "100" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "101" })).not.toBeInTheDocument();
});

test("next is disabled when on the last accessible page due to backend limit", () => {
  render(
    <Pagination
      page={100}
      limit={100}
      total={50000}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("shows truncation notice when results exceed backend limit", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={50000}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Why are some pages unavailable?" }),
  ).toBeInTheDocument();
});

test("does not show truncation notice when results are within backend limit", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={500}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Why are some pages unavailable?" }),
  ).not.toBeInTheDocument();
});

test("shows total events and per-page count summary", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={247}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
    />,
  );
  expect(screen.getByText("247 events")).toBeInTheDocument();
});

test("singleLine: hides per-page select", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={500}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
      singleLine
    />,
  );
  expect(screen.queryByRole("combobox", { name: "Per page" })).not.toBeInTheDocument();
});

test("singleLine: hides truncation notice even when results exceed backend limit", () => {
  render(
    <Pagination
      page={1}
      limit={100}
      total={50000}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
      singleLine
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Why are some pages unavailable?" }),
  ).not.toBeInTheDocument();
});

test("singleLine: still shows page numbers and event count", () => {
  render(
    <Pagination
      page={2}
      limit={100}
      total={350}
      onNavigate={vi.fn<(page: number, limit: number) => void>()}
      singleLine
    />,
  );
  expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByText("350 events")).toBeInTheDocument();
});
