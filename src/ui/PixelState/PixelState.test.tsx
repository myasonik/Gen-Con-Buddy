import { render, screen } from "@testing-library/react";
import { PixelState } from "./PixelState";

describe("PixelState", () => {
  it("renders loading text for loading variant", () => {
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    expect(screen.getByText("LOADING QUESTS...")).toBeInTheDocument();
  });

  it("does not show die icon for loading variant", () => {
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    expect(screen.queryByText("⚄")).not.toBeInTheDocument();
  });

  it("renders die icon and text for empty variant", () => {
    render(
      <PixelState
        variant="empty"
        text="NO QUESTS FOUND"
        subtext="Try broadening your search."
      />,
    );
    expect(screen.getByText("NO QUESTS FOUND")).toBeInTheDocument();
    expect(screen.getByText("Try broadening your search.")).toBeInTheDocument();
    expect(screen.getByText("⚄")).toBeInTheDocument();
  });

  it("renders error text and subtext for error variant", () => {
    render(
      <PixelState
        variant="error"
        text="QUEST FAILED"
        subtext="Unable to load events. Please try again."
      />,
    );
    expect(screen.getByText("QUEST FAILED")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to load events. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows a progress bar for the loading variant", () => {
    render(<PixelState variant="loading" text="Loading..." />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });

  it("does not show subtext element when subtext not provided", () => {
    const { rerender } = render(
      <PixelState variant="loading" text="LOADING..." subtext="hint" />,
    );
    expect(screen.getByText("hint")).toBeInTheDocument();
    rerender(<PixelState variant="loading" text="LOADING..." />);
    expect(screen.queryByText("hint")).not.toBeInTheDocument();
  });
});
