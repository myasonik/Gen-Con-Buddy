import { expect, expectTypeOf, test } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "./renderRoute";

test("renders the search page at /", async () => {
  await renderRoute("/");
  expect(screen.getByRole("main")).toBeInTheDocument();
});

test("passes searchParams as URL params to the route", async () => {
  await renderRoute("/", { searchParams: { eventType: "RPG" } });
  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
});

test("returns a user instance", async () => {
  const { user } = await renderRoute("/");
  expect(user).toBeDefined();
  expectTypeOf(user.click).toBeFunction();
});

test("renders page-specific content for multiple routes", async () => {
  await renderRoute("/");
  expect(screen.getByRole("banner")).toHaveTextContent("Gen Con Buddy");
});
