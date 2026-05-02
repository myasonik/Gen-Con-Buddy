import { StrictMode } from "react";
import { expect, test } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
  Outlet,
} from "@tanstack/react-router";
import { AboutPage } from "../components/AboutPage/AboutPage";

async function renderAboutPage(): Promise<void> {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const aboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/about",
    component: AboutPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([aboutRoute]),
    history: createMemoryHistory({ initialEntries: ["/about"] }),
  });
  await act(async () => {
    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  });
}

test("renders the about page heading", async () => {
  await renderAboutPage();
  expect(
    screen.getByRole("heading", { level: 1, name: /about gen con buddy/i }),
  ).toBeInTheDocument();
});

test("renders a GitHub link with correct href and security attributes", async () => {
  await renderAboutPage();
  const link = screen.getByRole("link", { name: /open source on github/i });
  expect(link).toHaveAttribute("href", "https://github.com/myasonik/Gen-Con-Buddy");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("renders EventDB attribution link", async () => {
  await renderAboutPage();
  const link = screen.getByRole("link", { name: /eventdb/i });
  expect(link).toHaveAttribute("href", "https://gencon.eventdb.us/about.php");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("renders game-icons.net attribution link", async () => {
  await renderAboutPage();
  const link = screen.getByRole("link", { name: /game-icons\.net/i });
  expect(link).toHaveAttribute("href", "https://game-icons.net");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});
