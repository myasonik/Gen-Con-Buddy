import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { SortDrawer } from "./SortDrawer";

test("renders Sort trigger button", () => {
  render(<SortDrawer />);
  expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
});

test("opens drawer with title Sort on button click", async () => {
  const user = userEvent.setup();
  render(<SortDrawer />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  expect(screen.getByRole("dialog", { name: "Sort" })).toBeInTheDocument();
});

test("Close button dismisses the Sort drawer", async () => {
  const user = userEvent.setup();
  render(<SortDrawer />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog", { name: "Sort" })).not.toBeInTheDocument();
});
