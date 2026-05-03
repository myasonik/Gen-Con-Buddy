import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Drawer } from "./Drawer";

test("renders trigger button", () => {
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
});

test("does not render children before trigger is clicked", () => {
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  expect(screen.queryByText("drawer content")).not.toBeInTheDocument();
});

test("opens and renders children when trigger is clicked", async () => {
  const user = userEvent.setup();
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByText("drawer content")).toBeInTheDocument();
});

test("renders title when open", async () => {
  const user = userEvent.setup();
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByText("Filter Events")).toBeInTheDocument();
});

test("closes when close button is activated", async () => {
  const user = userEvent.setup();
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByText("drawer content")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByText("drawer content")).not.toBeInTheDocument();
});

test("has role=dialog when open", async () => {
  const user = userEvent.setup();
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("accessible title is present when open", async () => {
  const user = userEvent.setup();
  render(
    <Drawer trigger={<button type="button">Open</button>} title="My Drawer">
      <p>content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByRole("dialog", { name: "My Drawer" })).toBeInTheDocument();
});

test("renders footer when provided", async () => {
  const user = userEvent.setup();
  render(
    <Drawer
      trigger={<button type="button">Open</button>}
      title="Filter Events"
      footer={<button type="button">Apply</button>}
    >
      <p>drawer content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
});

test("omits footer element when footer prop not provided", async () => {
  const user = userEvent.setup();
  render(
    <Drawer trigger={<button type="button">Open</button>} title="Filter Events">
      <p>drawer content</p>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  // The scrollable content area is present but no footer container
  expect(screen.queryByTestId("drawer-footer")).not.toBeInTheDocument();
});
