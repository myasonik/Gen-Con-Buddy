import { render, screen, waitFor } from "@testing-library/react";
import { PixelState } from "./PixelState";
import { __reset } from "../../lib/announce";

function setupLiveRegions() {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  polite.setAttribute("aria-live", "polite");
  document.body.appendChild(polite);

  const assertive = document.createElement("div");
  assertive.id = "live-assertive";
  assertive.setAttribute("aria-live", "assertive");
  document.body.appendChild(assertive);

  return () => {
    polite.remove();
    assertive.remove();
  };
}

afterEach(() => {
  __reset();
});

describe("PixelState", () => {
  it("renders loading text for loading variant", () => {
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    expect(screen.getByText("LOADING QUESTS...")).toBeInTheDocument();
  });

  it("does not show die icon for loading variant", () => {
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    expect(screen.queryByText("⚄")).not.toBeInTheDocument();
  });

  it("renders meeple icon and text for empty variant", () => {
    render(
      <PixelState
        variant="empty"
        text="NO QUESTS FOUND"
        subtext="Try broadening your search."
      />,
    );
    expect(screen.getByText("NO QUESTS FOUND")).toBeInTheDocument();
    expect(screen.getByText("Try broadening your search.")).toBeInTheDocument();
    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
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
    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
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

  it("announces loading text politely", async () => {
    const cleanup = setupLiveRegions();
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    await waitFor(() => {
      expect(document.getElementById("live-polite")?.textContent).toBe(
        "LOADING QUESTS...",
      );
    });
    cleanup();
  });

  it("announces error text assertively", async () => {
    const cleanup = setupLiveRegions();
    render(<PixelState variant="error" text="QUEST FAILED" />);
    await waitFor(() => {
      expect(document.getElementById("live-assertive")?.textContent).toBe(
        "QUEST FAILED",
      );
    });
    cleanup();
  });

  it("announces empty text politely", async () => {
    const cleanup = setupLiveRegions();
    render(<PixelState variant="empty" text="NO QUESTS FOUND" />);
    await waitFor(() => {
      expect(document.getElementById("live-polite")?.textContent).toBe(
        "NO QUESTS FOUND",
      );
    });
    cleanup();
  });
});
