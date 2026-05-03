import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { createIcon } from "./createIcon";

const TestIcon = createIcon("TestIcon", "0 0 24 24", <path d="M12 2L2 22h20L12 2z" />);

test("renders an SVG element", () => {
  render(<TestIcon data-testid="icon" />);
  const svg = screen.getByTestId("icon");
  expect(svg.tagName.toLowerCase()).toBe("svg");
});

test("aria-hidden is true by default when no a11y prop is passed", () => {
  render(<TestIcon data-testid="icon" />);
  expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
});

test("aria-hidden is NOT present when aria-label is passed", () => {
  render(<TestIcon data-testid="icon" aria-label="test icon" />);
  expect(screen.getByTestId("icon")).not.toHaveAttribute("aria-hidden");
});

test("aria-hidden is NOT present when role is passed", () => {
  render(<TestIcon data-testid="icon" role="img" />);
  expect(screen.getByTestId("icon")).not.toHaveAttribute("aria-hidden");
});

test("aria-hidden is NOT present when title prop is passed", () => {
  // title is handled by hasA11yProp at runtime; cast needed since it's not in LucideProps
  const props = { "data-testid": "icon", title: "icon title" } as React.ComponentProps<
    typeof TestIcon
  >;
  render(<TestIcon {...props} />);
  expect(screen.getByTestId("icon")).not.toHaveAttribute("aria-hidden");
});

test("explicit aria-hidden=false overrides the default (user wins)", () => {
  render(<TestIcon data-testid="icon" aria-hidden={false} />);
  expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "false");
});

test("returned component has displayName set", () => {
  expect(TestIcon.displayName).toBe("TestIcon");
});

test("forwards ref to the underlying SVG element", () => {
  const ref = React.createRef<SVGSVGElement>();
  render(<TestIcon ref={ref} />);
  expect(ref.current).not.toBeNull();
  expect(ref.current?.tagName.toLowerCase()).toBe("svg");
});
