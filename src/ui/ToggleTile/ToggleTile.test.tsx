import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleTile, ToggleTileGroup } from "./ToggleTile";

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

  it("has aria-pressed='true' when pressed", () => {
    render(<ToggleTile pressed>Fri</ToggleTile>);
    expect(screen.getByRole("button", { name: "Fri" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("is disabled when disabled prop is set", () => {
    render(<ToggleTile disabled>Sat</ToggleTile>);
    expect(screen.getByRole("button", { name: "Sat" })).toBeDisabled();
  });

  it("calls onPressedChange when clicked", async () => {
    const handleChange = vi.fn();
    render(<ToggleTile onPressedChange={handleChange}>Sun</ToggleTile>);
    await userEvent.click(screen.getByRole("button", { name: "Sun" }));
    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("does not call onPressedChange when disabled", async () => {
    const handleChange = vi.fn();
    render(
      <ToggleTile disabled onPressedChange={handleChange}>
        Wed
      </ToggleTile>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wed" }), {
      pointerEventsCheck: 0,
    });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("renders no icon when unpressed", () => {
    render(<ToggleTile>Thu</ToggleTile>);
    expect(
      screen.getByRole("button", { name: "Thu" }).querySelector("svg"),
    ).not.toBeInTheDocument();
  });
});

describe("ToggleTileGroup", () => {
  it("marks pressed tiles via value prop", () => {
    render(
      <ToggleTileGroup value={["wed"]} onValueChange={() => {}}>
        <ToggleTile value="wed">Wed</ToggleTile>
        <ToggleTile value="thu">Thu</ToggleTile>
      </ToggleTileGroup>,
    );
    expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Thu" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onValueChange when a tile is clicked", async () => {
    const handleChange = vi.fn();
    render(
      <ToggleTileGroup value={[]} onValueChange={handleChange}>
        <ToggleTile value="wed">Wed</ToggleTile>
      </ToggleTileGroup>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wed" }));
    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("navigates between tiles with arrow keys", async () => {
    render(
      <ToggleTileGroup value={[]} onValueChange={() => {}}>
        <ToggleTile value="wed">Wed</ToggleTile>
        <ToggleTile value="thu">Thu</ToggleTile>
        <ToggleTile value="fri">Fri</ToggleTile>
      </ToggleTileGroup>,
    );
    screen.getByRole("button", { name: "Wed" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Thu" })).toHaveFocus();
  });

  it("disables all tiles when group is disabled", () => {
    render(
      <ToggleTileGroup value={[]} onValueChange={() => {}} disabled>
        <ToggleTile value="wed">Wed</ToggleTile>
        <ToggleTile value="thu">Thu</ToggleTile>
      </ToggleTileGroup>,
    );
    expect(screen.getByRole("button", { name: "Wed" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thu" })).toBeDisabled();
  });
});
