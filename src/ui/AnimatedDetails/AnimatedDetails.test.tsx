import { expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnimatedDetails } from "./AnimatedDetails";

test("renders a details element", () => {
  render(<AnimatedDetails summary="Toggle">content</AnimatedDetails>);
  expect(document.querySelector("details")).toBeInTheDocument();
});

test("renders summary element with provided content", () => {
  render(<AnimatedDetails summary="My Summary">content</AnimatedDetails>);
  expect(screen.getByText("My Summary").tagName).toBe("SUMMARY");
});

test("wraps children in a div inside details", () => {
  render(<AnimatedDetails summary="Toggle">body content</AnimatedDetails>);
  const div = document.querySelector("details > div");
  expect(div).not.toBeNull();
  expect(div?.textContent).toBe("body content");
});

test("merges className onto details", () => {
  render(
    <AnimatedDetails summary="Toggle" className="extra">
      content
    </AnimatedDetails>,
  );
  expect(document.querySelector("details")).toHaveClass("extra");
});

test("applies summaryClassName to summary element", () => {
  render(
    <AnimatedDetails summary="Toggle" summaryClassName="sum-class">
      content
    </AnimatedDetails>,
  );
  expect(screen.getByText("Toggle")).toHaveClass("sum-class");
});

test("forwards open prop to details", () => {
  render(
    <AnimatedDetails summary="Toggle" open>
      content
    </AnimatedDetails>,
  );
  expect(document.querySelector("details")).toHaveAttribute("open");
});

test("forwards onToggle to details", () => {
  const onToggle = vi.fn<() => void>();
  render(
    <AnimatedDetails summary="Toggle" onToggle={onToggle}>
      content
    </AnimatedDetails>,
  );
  const details = document.querySelector("details");
  if (details) {
    fireEvent(details, new Event("toggle"));
  }
  expect(onToggle).toHaveBeenCalledTimes(1);
});

test("clicking summary on closed details initiates open animation", () => {
  render(<AnimatedDetails summary="Toggle">content</AnimatedDetails>);
  fireEvent.click(screen.getByText("Toggle"));
  const details = document.querySelector("details");
  expect(details).toHaveAttribute("open");
  expect(details).toHaveClass("is-animating");
  expect(details).not.toHaveClass("is-closing");
  expect(details).not.toHaveClass("is-opening");
});

test("open animation completes and is-animating is removed after transitionend on content div", () => {
  render(<AnimatedDetails summary="Toggle">content</AnimatedDetails>);
  fireEvent.click(screen.getByText("Toggle"));
  const details = document.querySelector("details");
  expect(details).not.toBeNull();
  if (!details) {
    return;
  }
  const contentDiv = details.querySelector(":scope > div");
  expect(contentDiv).not.toBeNull();
  if (!contentDiv) {
    return;
  }
  fireEvent(contentDiv, new Event("transitionend", { bubbles: true }));
  expect(details).not.toHaveClass("is-animating");
  expect(details).toHaveAttribute("open");
});

test("clicking summary on open details initiates close animation", () => {
  render(
    <AnimatedDetails summary="Toggle" open>
      content
    </AnimatedDetails>,
  );
  fireEvent.click(screen.getByText("Toggle"));
  const details = document.querySelector("details");
  expect(details).toHaveClass("is-closing");
  expect(details).toHaveClass("is-animating");
});

test("close animation completes and details closes after transitionend on content div", () => {
  render(
    <AnimatedDetails summary="Toggle" open>
      content
    </AnimatedDetails>,
  );
  fireEvent.click(screen.getByText("Toggle"));
  const details = document.querySelector("details");
  expect(details).not.toBeNull();
  if (!details) {
    return;
  }
  const contentDiv = details.querySelector(":scope > div");
  expect(contentDiv).not.toBeNull();
  if (!contentDiv) {
    return;
  }
  fireEvent(contentDiv, new Event("transitionend", { bubbles: true }));
  expect(details).not.toHaveClass("is-closing");
  expect(details).not.toHaveClass("is-animating");
  expect(details).not.toHaveAttribute("open");
});
