import { render, screen } from "@testing-library/react";
import { Badge, BoolBadge, ConceptBadge } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>ticketed</Badge>);
    expect(screen.getByText("ticketed")).toBeInTheDocument();
  });

  it("applies filled variant by default", () => {
    render(<Badge>ticketed</Badge>);
    expect(screen.getByText("ticketed")).toHaveAttribute(
      "data-variant",
      "filled",
    );
  });

  it("forwards className prop", () => {
    render(<Badge className="custom-class">ticketed</Badge>);
    expect(screen.getByText("ticketed").closest("span")).toHaveClass(
      "custom-class",
    );
  });

  it("applies outline variant", () => {
    render(<Badge variant="outline">free</Badge>);
    expect(screen.getByText("free")).toHaveAttribute("data-variant", "outline");
  });
});

describe("BoolBadge", () => {
  it("shows ✓ for true", () => {
    render(<BoolBadge value={true} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows ✓ for 'yes' string (case-insensitive)", () => {
    render(<BoolBadge value="yes" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows ✓ for 'Yes' (capitalized)", () => {
    render(<BoolBadge value="Yes" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows — for false", () => {
    render(<BoolBadge value={false} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows — for 'no' string", () => {
    render(<BoolBadge value="no" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows — for empty string", () => {
    render(<BoolBadge value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows sr-only 'yes' for true", () => {
    render(<BoolBadge value={true} />);
    expect(screen.getByText("yes")).toBeInTheDocument();
  });

  it("shows sr-only 'no' for false", () => {
    render(<BoolBadge value={false} />);
    expect(screen.getByText("no")).toBeInTheDocument();
  });
});

describe("ConceptBadge", () => {
  it("renders the value as text when no children given", () => {
    render(<ConceptBadge concept="eventType" value="RPG" />);
    expect(screen.getByText("RPG")).toBeInTheDocument();
  });

  it("renders children instead of value when provided", () => {
    render(
      <ConceptBadge
        concept="experience"
        value="None (You've never played before - rules will be taught)"
      >
        None
      </ConceptBadge>,
    );
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("applies roleplay color custom properties for RPG", () => {
    const { container } = render(
      <ConceptBadge concept="eventType" value="RPG" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--concept-color")).toBe("#5c3a7a");
    expect(el.style.getPropertyValue("--concept-bg")).toBe("#f0eaf7");
  });

  it("applies Thursday color custom properties for day", () => {
    const { container } = render(
      <ConceptBadge concept="day" value="Thursday" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--concept-color")).toBe("#7a4a00");
    expect(el.style.getPropertyValue("--concept-bg")).toBe("#fdf0d8");
  });

  it("applies no inline style for an unknown value", () => {
    const { container } = render(
      <ConceptBadge concept="eventType" value="UNKNOWN" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--concept-color")).toBe("");
  });
});
