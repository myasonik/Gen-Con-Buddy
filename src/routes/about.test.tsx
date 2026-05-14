import { expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "../test/renderRoute";

test("renders the about page heading", async () => {
  await renderRoute("/about");
  expect(
    screen.getByRole("heading", { level: 1, name: /about gen con buddy/i }),
  ).toBeInTheDocument();
});

test("renders a GitHub link with correct href and security attributes", async () => {
  await renderRoute("/about");
  const link = screen.getByRole("link", { name: /open source on github/i });
  expect(link).toHaveAttribute("href", "https://github.com/myasonik/Gen-Con-Buddy");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("renders EventDB attribution link", async () => {
  await renderRoute("/about");
  const link = screen.getByRole("link", { name: /eventdb/i });
  expect(link).toHaveAttribute("href", "https://gencon.eventdb.us/about.php");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("renders game-icons.net attribution link", async () => {
  await renderRoute("/about");
  const link = screen.getByRole("link", { name: /game-icons\.net/i });
  expect(link).toHaveAttribute("href", "https://game-icons.net");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("sets document.title to 'About | Gen Con Buddy'", async () => {
  await renderRoute("/about");
  expect(document.title).toBe("About | Gen Con Buddy");
});

test("sets og:title meta to 'About | Gen Con Buddy'", async () => {
  await renderRoute("/about");
  expect(
    document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
  ).toBe("About | Gen Con Buddy");
});
