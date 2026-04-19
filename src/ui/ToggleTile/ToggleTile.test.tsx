import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleTile } from "./ToggleTile";

describe("ToggleTile", () => {
  it("renders as a button with the given label", () => {
    render(<ToggleTile>Wed</ToggleTile>);
    expect(screen.getByRole("button", { name: "Wed" })).toBeInTheDocument();
  });

  it("has aria-pressed='false' by default", () => {
    render(<ToggleTile>Thu</ToggleTile>);
    expect(screen.getByRole("button", { name: "Thu" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("has aria-pressed='true' when selected", () => {
    render(<ToggleTile selected>Fri</ToggleTile>);
    expect(screen.getByRole("button", { name: "Fri" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("is disabled when disabled prop is set", () => {
    render(<ToggleTile disabled>Sat</ToggleTile>);
    expect(screen.getByRole("button", { name: "Sat" })).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<ToggleTile onClick={handleClick}>Sun</ToggleTile>);
    await userEvent.click(screen.getByRole("button", { name: "Sun" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <ToggleTile disabled onClick={handleClick}>
        Wed
      </ToggleTile>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wed" }), {
      pointerEventsCheck: 0,
    });
    expect(handleClick).not.toHaveBeenCalled();
  });
});
