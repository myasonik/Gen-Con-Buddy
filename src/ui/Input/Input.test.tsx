import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./Input";
import styles from "./Input.module.css";

describe("Input", () => {
  it("renders a text input by default", () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("forwards native input props", () => {
    render(<Input aria-label="Search" placeholder="Type here…" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Type here…");
  });

  it("applies the base input class", () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole("textbox")).toHaveClass(styles.input);
  });

  it("merges a caller-supplied className without replacing base styles", () => {
    render(<Input aria-label="Name" className="custom-width" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass(styles.input);
    expect(input).toHaveClass("custom-width");
  });

  it("forwards ref to the underlying input element", () => {
    let captured: HTMLInputElement | null = null;
    render(
      <Input
        aria-label="Name"
        ref={(el) => {
          captured = el;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLInputElement);
  });
});

describe("Input disabled state", () => {
  it("is disabled when disabled prop is set", () => {
    render(<Input aria-label="Name" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

describe("Input error state", () => {
  it("passes aria-invalid through to the input element", () => {
    render(<Input aria-label="Email" aria-invalid="true" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});
