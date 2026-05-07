import { expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "../test/renderRoute";

test("Changelog nav link is active when on /changelog with open params in URL", async () => {
  await renderRoute("/changelog?open=1");
  const link = screen.getByRole("link", { name: "Changelog" });
  expect(link).toHaveAttribute("data-status", "active");
});

test("Changelog nav link is active when on /changelog with no open params", async () => {
  await renderRoute("/changelog");
  const link = screen.getByRole("link", { name: "Changelog" });
  expect(link).toHaveAttribute("data-status", "active");
});

test("Search nav link is not active when on /changelog", async () => {
  await renderRoute("/changelog");
  const link = screen.getByRole("link", { name: "Search" });
  expect(link).not.toHaveAttribute("data-status", "active");
});
