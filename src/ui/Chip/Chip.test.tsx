import { vi, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip tone="neutral">BGM</Chip>);
    expect(screen.getByText("BGM")).toBeInTheDocument();
  });

  it("renders as a span by default", () => {
    render(<Chip tone="neutral">BGM</Chip>);
    // The root element should not be a button when there's no onRemove
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Chip tone", () => {
  const tones = ["neutral", "accent", "jade", "cobalt", "amber", "error"] as const;

  it.each(tones)(`applies data-tone="%s" for tone="%s"`, (tone) => {
    const { container } = render(<Chip tone={tone}>Label</Chip>);
    expect(container.firstChild).toHaveAttribute("data-tone", tone);
  });
});

describe("Chip onRemove", () => {
  it("renders a remove button when onRemove is provided", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        BGM
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();
  });

  it("does not render a remove button when onRemove is absent", () => {
    render(<Chip tone="accent">BGM</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        BGM
      </Chip>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove BGM" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("remove button is a real <button> element, not a plain × character", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        BGM
      </Chip>,
    );
    const btn = screen.getByRole("button", { name: "Remove BGM" });
    expect(btn.tagName).toBe("BUTTON");
  });
});

describe("Chip icon", () => {
  it("renders icon before children", () => {
    const icon = <span data-testid="test-icon">★</span>;
    render(
      <Chip tone="accent" icon={icon}>
        BGM
      </Chip>,
    );
    const chipRoot = screen.getByText("BGM").closest("[data-tone]");
    expect(chipRoot).not.toBeNull();
    const testIcon = screen.getByTestId("test-icon");
    expect(testIcon).toBeInTheDocument();
    // Icon should appear before the text in the DOM
    const children = Array.from((chipRoot as Element).childNodes);
    const iconIdx = children.findIndex((n) => (n as Element).contains?.(testIcon));
    const textIdx = children.findIndex(
      (n) => n.textContent?.includes("BGM") && !(n as Element).contains?.(testIcon),
    );
    expect(iconIdx).toBeLessThan(textIdx);
  });

  it("does not render an icon slot when icon is absent", () => {
    render(<Chip tone="accent">BGM</Chip>);
    expect(screen.queryByTestId("test-icon")).not.toBeInTheDocument();
  });
});

describe("Chip className", () => {
  it("merges passed className with internal chip class", () => {
    const { container } = render(
      <Chip tone="accent" className="extra-class">
        BGM
      </Chip>,
    );
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain("extra-class");
    expect(chip.className.split(" ").length).toBeGreaterThan(1);
  });
});

describe("Chip size", () => {
  it("defaults to size md", () => {
    const { container } = render(<Chip tone="neutral">BGM</Chip>);
    expect(container.firstChild).toHaveAttribute("data-size", "md");
  });

  it("applies data-size=sm for size=sm", () => {
    const { container } = render(
      <Chip tone="neutral" size="sm">
        BGM
      </Chip>,
    );
    expect(container.firstChild).toHaveAttribute("data-size", "sm");
  });

  it("applies data-size=md for size=md", () => {
    const { container } = render(
      <Chip tone="neutral" size="md">
        BGM
      </Chip>,
    );
    expect(container.firstChild).toHaveAttribute("data-size", "md");
  });
});

describe("Chip removeLabel (toRemoveLabel branches)", () => {
  it("uses removeLabel prop instead of children for the remove button label", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove} removeLabel="Custom Label">
        BGM
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove Custom Label" })).toBeInTheDocument();
  });

  it("uses numeric children as the remove label", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        {42}
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove 42" })).toBeInTheDocument();
  });

  it("uses first string in array children as the remove label", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        {["BGM", " — Board Game"]}
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();
  });

  it("falls back to empty string when array children has no string or number", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        {[<span key="a">complex</span>]}
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("falls back to empty string when children is a React element", () => {
    const onRemove = vi.fn<() => void>();
    render(
      <Chip tone="accent" onRemove={onRemove}>
        <span>complex</span>
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
