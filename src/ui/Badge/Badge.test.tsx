import { render, screen } from "@testing-library/react";
import { Badge, BoolBadge } from "./Badge";

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
});
