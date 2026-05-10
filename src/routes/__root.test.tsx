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

test("Search nav link is active when on / with query params", async () => {
  await renderRoute("/?q=dominion&sort=title");
  const link = screen.getByRole("link", { name: "Search" });
  expect(link).toHaveAttribute("data-status", "active");
});

test("Search nav link is not active when on /changelog", async () => {
  await renderRoute("/changelog");
  const link = screen.getByRole("link", { name: "Search" });
  expect(link).not.toHaveAttribute("data-status", "active");
});

test("Changelog nav link href contains no filter params", async () => {
  await renderRoute("/");
  const link = screen.getByRole("link", { name: "Changelog" });
  const href = link.getAttribute("href") ?? "";
  expect(href).not.toMatch(/[?&](eventType|days|timeStart|timeEnd)=/);
});

test("Changelog nav link href contains no filter params when navigating from a filtered URL", async () => {
  await renderRoute("/changelog?days=thu&eventType=RPG");
  const link = screen.getByRole("link", { name: "Changelog" });
  const href = link.getAttribute("href") ?? "";
  expect(href).not.toMatch(/[?&](eventType|days|timeStart|timeEnd)=/);
});
