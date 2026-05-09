import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible } from "./Collapsible";

test("renders trigger button with provided content", () => {
  render(<Collapsible trigger="Open me">content</Collapsible>);
  expect(screen.getByRole("button", { name: "Open me" })).toBeInTheDocument();
});

test("panel content is hidden by default (uncontrolled)", () => {
  render(<Collapsible trigger="Toggle">hidden content</Collapsible>);
  expect(screen.queryByText("hidden content")).not.toBeInTheDocument();
});

test("open={true} shows panel content", () => {
  render(
    <Collapsible trigger="Toggle" open>
      visible content
    </Collapsible>,
  );
  expect(screen.getByText("visible content")).toBeInTheDocument();
});

test("open={false} hides panel content", () => {
  render(
    <Collapsible trigger="Toggle" open={false}>
      hidden content
    </Collapsible>,
  );
  expect(screen.queryByText("hidden content")).not.toBeInTheDocument();
});

test("clicking trigger opens an uncontrolled collapsible", async () => {
  render(<Collapsible trigger="Toggle">body content</Collapsible>);
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(screen.getByText("body content")).toBeInTheDocument();
});

test("clicking trigger twice closes an uncontrolled collapsible", async () => {
  render(<Collapsible trigger="Toggle">body content</Collapsible>);
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(screen.queryByText("body content")).not.toBeInTheDocument();
});

test("onOpenChange is called with true when closed trigger is clicked", async () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  render(
    <Collapsible trigger="Toggle" open={false} onOpenChange={onOpenChange}>
      content
    </Collapsible>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(onOpenChange).toHaveBeenCalledWith(true);
});

test("onOpenChange is called with false when open trigger is clicked", async () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  render(
    <Collapsible trigger="Toggle" open onOpenChange={onOpenChange}>
      content
    </Collapsible>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("className applies to the root element", () => {
  render(
    <Collapsible trigger="Toggle" className="my-class">
      content
    </Collapsible>,
  );
  expect(document.querySelector(".my-class")).toBeInTheDocument();
});

test("triggerClassName applies to the trigger button", () => {
  render(
    <Collapsible trigger="Toggle" triggerClassName="btn-class">
      content
    </Collapsible>,
  );
  expect(screen.getByRole("button", { name: "Toggle" })).toHaveClass("btn-class");
});

test("onOpenChange fires on keyboard activation", async () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  render(
    <Collapsible trigger="Toggle" open={false} onOpenChange={onOpenChange}>
      content
    </Collapsible>,
  );
  screen.getByRole("button", { name: "Toggle" }).focus();
  await userEvent.keyboard(" ");
  expect(onOpenChange).toHaveBeenCalledWith(true);
});
