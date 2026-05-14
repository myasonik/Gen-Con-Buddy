import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, beforeEach } from "vitest";
import { ThemePopover } from "./ThemePopover";
import { __reset } from "../../lib/announce";

function setupLiveRegions(): () => void {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  document.body.appendChild(polite);
  return () => polite.remove();
}

beforeEach(() => {
  __reset();
});

function renderPopover(
  overrides: Partial<React.ComponentProps<typeof ThemePopover>> = {},
): ReturnType<typeof render> {
  return render(
    <ThemePopover theme="auto" setTheme={vi.fn<(v: string) => void>()} {...overrides} />,
  );
}

test("renders a theme toggle button", () => {
  renderPopover();
  expect(screen.getByRole("button", { name: "Theme: Auto" })).toBeInTheDocument();
});

test("trigger aria-label reflects 'light' preference", () => {
  renderPopover({ theme: "light" });
  expect(screen.getByRole("button", { name: "Theme: Light" })).toBeInTheDocument();
});

test("trigger aria-label reflects 'dark' preference", () => {
  renderPopover({ theme: "dark" });
  expect(screen.getByRole("button", { name: "Theme: Dark" })).toBeInTheDocument();
});

test("opens popover with three radio options when clicked", async () => {
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Theme: Auto" }));
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeInTheDocument();
});

test("Auto radio is checked when theme is 'auto'", async () => {
  const user = userEvent.setup();
  renderPopover({ theme: "auto" });
  await user.click(screen.getByRole("button", { name: "Theme: Auto" }));
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeChecked();
});

test("Light radio is checked when theme is 'light'", async () => {
  const user = userEvent.setup();
  renderPopover({ theme: "light" });
  await user.click(screen.getByRole("button", { name: "Theme: Light" }));
  expect(screen.getByRole("radio", { name: /Light/i })).toBeChecked();
});

test("Dark radio is checked when theme is 'dark'", async () => {
  const user = userEvent.setup();
  renderPopover({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeChecked();
});

test("selecting Dark calls setTheme with 'dark'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  renderPopover({ setTheme });
  await user.click(screen.getByRole("button", { name: "Theme: Auto" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(setTheme).toHaveBeenCalledWith("dark");
});

test("selecting Light calls setTheme with 'light'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  renderPopover({ theme: "dark", setTheme });
  await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  expect(setTheme).toHaveBeenCalledWith("light");
});

test("selecting Auto calls setTheme with 'auto'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  renderPopover({ theme: "dark", setTheme });
  await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  expect(setTheme).toHaveBeenCalledWith("auto");
});

test("popover closes after selecting a theme", async () => {
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Theme: Auto" }));
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("announces 'Theme: Dark' when Dark is selected", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Theme: Auto" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Dark");
  });
  cleanup();
});

test("announces 'Theme: Light' when Light is selected", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  renderPopover({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Light");
  });
  cleanup();
});

test("announces 'Theme: Auto' when Auto is selected", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  renderPopover({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Auto");
  });
  cleanup();
});
