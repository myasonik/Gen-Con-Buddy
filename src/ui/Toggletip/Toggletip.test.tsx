import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggletip } from "./Toggletip";

describe("Toggletip", () => {
  it("renders a ? button with the given aria-label", () => {
    render(
      <Toggletip
        label="Why are day filters disabled?"
        message="Because reasons"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Why are day filters disabled?" }),
    ).toBeInTheDocument();
  });

  it("does not show tooltip initially", () => {
    render(<Toggletip label="Why?" message="Because" />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip content when button is clicked", async () => {
    render(<Toggletip label="Why?" message="Clear the day checkboxes" />);
    await userEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Clear the day checkboxes",
    );
  });

  it("hides tooltip when button is clicked a second time", async () => {
    render(<Toggletip label="Why?" message="Because" />);
    const btn = screen.getByRole("button", { name: "Why?" });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip on Escape key", async () => {
    render(<Toggletip label="Why?" message="Because" />);
    await userEvent.click(screen.getByRole("button", { name: "Why?" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip when clicking outside", async () => {
    render(
      <div>
        <Toggletip label="Why?" message="Because" />
        <button type="button">Outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sets aria-expanded on trigger when open", async () => {
    render(<Toggletip label="Why?" message="Because" />);
    const btn = screen.getByRole("button", { name: "Why?" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });
});
