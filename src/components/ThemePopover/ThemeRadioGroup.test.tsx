import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ThemeRadioGroup } from "./ThemeRadioGroup";

function renderGroup(
  overrides: Partial<React.ComponentProps<typeof ThemeRadioGroup>> = {},
): ReturnType<typeof render> {
  return render(
    <ThemeRadioGroup theme="auto" resolvedTheme="light" onValueChange={vi.fn()} {...overrides} />,
  );
}

test("renders three radio options", () => {
  renderGroup();
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeInTheDocument();
});

test("Auto radio is checked when theme is 'auto'", () => {
  renderGroup({ theme: "auto" });
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeChecked();
});

test("Light radio is checked when theme is 'light'", () => {
  renderGroup({ theme: "light" });
  expect(screen.getByRole("radio", { name: /Light/i })).toBeChecked();
});

test("Dark radio is checked when theme is 'dark'", () => {
  renderGroup({ theme: "dark" });
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeChecked();
});

test("shows 'Currently: Dark' when theme is auto and resolvedTheme is dark", () => {
  renderGroup({ theme: "auto", resolvedTheme: "dark" });
  expect(screen.getByText("Currently: Dark")).toBeInTheDocument();
});

test("shows 'Currently: Light' when theme is auto and resolvedTheme is light", () => {
  renderGroup({ theme: "auto", resolvedTheme: "light" });
  expect(screen.getByText("Currently: Light")).toBeInTheDocument();
});

test("does not show 'Currently' note when theme is explicit", () => {
  renderGroup({ theme: "dark" });
  expect(screen.queryByText(/Currently:/)).not.toBeInTheDocument();
});

test("onValueChange called with 'light' when Light radio clicked", async () => {
  const onValueChange = vi.fn<(v: string) => void>();
  const user = userEvent.setup();
  renderGroup({ theme: "dark", onValueChange });
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  expect(onValueChange).toHaveBeenCalledWith("light");
});

test("onValueChange called with 'dark' when Dark radio clicked", async () => {
  const onValueChange = vi.fn<(v: string) => void>();
  const user = userEvent.setup();
  renderGroup({ onValueChange });
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(onValueChange).toHaveBeenCalledWith("dark");
});

test("onValueChange called with 'auto' when Auto radio clicked", async () => {
  const onValueChange = vi.fn<(v: string) => void>();
  const user = userEvent.setup();
  renderGroup({ theme: "dark", onValueChange });
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  expect(onValueChange).toHaveBeenCalledWith("auto");
});
