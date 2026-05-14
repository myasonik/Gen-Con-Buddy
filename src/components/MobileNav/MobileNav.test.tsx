import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, beforeEach } from "vitest";
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
} from "@tanstack/react-router";
import { MobileNav } from "./MobileNav";
import { __reset } from "../../lib/announce";

function setupLiveRegions(): () => void {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  document.body.appendChild(polite);
  return () => polite.remove();
}

interface MobileNavProps {
  theme: "light" | "dark" | "auto";
  setTheme: (v: "light" | "dark" | "auto") => void;
}

async function renderNav(
  overrides: Partial<MobileNavProps> = {},
): Promise<ReturnType<typeof render>> {
  const props: MobileNavProps = {
    theme: "auto",
    setTheme: vi.fn<(v: "light" | "dark" | "auto") => void>(),
    ...overrides,
  };
  const rootRoute = createRootRoute({ component: () => <MobileNav {...props} /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
  const changelogRoute = createRoute({ getParentRoute: () => rootRoute, path: "/changelog" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, changelogRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  let result: ReturnType<typeof render> = {} as ReturnType<typeof render>;
  await act(async () => {
    result = render(<RouterProvider router={router} />);
  });
  return result;
}

beforeEach(() => {
  __reset();
});

test("renders a button with aria-label 'Navigation'", async () => {
  await renderNav();
  expect(screen.getByRole("button", { name: "Navigation" })).toBeInTheDocument();
});

test("popover is closed by default", async () => {
  await renderNav();
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("clicking the button opens the popover", async () => {
  const user = userEvent.setup();
  await renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeInTheDocument();
});

test("clicking the Search link closes the popover", async () => {
  const user = userEvent.setup();
  await renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Search" }));
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("clicking the Changelog link closes the popover", async () => {
  const user = userEvent.setup();
  await renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Changelog" }));
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("clicking a radio option does NOT close the popover", async () => {
  const user = userEvent.setup();
  await renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
});

test("clicking Dark radio calls setTheme with 'dark'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  await renderNav({ setTheme });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(setTheme).toHaveBeenCalledWith("dark");
});

test("clicking Light radio calls setTheme with 'light'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  await renderNav({ theme: "dark", setTheme });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  expect(setTheme).toHaveBeenCalledWith("light");
});

test("clicking Auto radio calls setTheme with 'auto'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  await renderNav({ theme: "dark", setTheme });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  expect(setTheme).toHaveBeenCalledWith("auto");
});

test("announces 'Theme: Dark' when Dark radio clicked", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  await renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Dark");
  });
  cleanup();
});

test("announces 'Theme: Light' when Light radio clicked", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  await renderNav({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Light");
  });
  cleanup();
});

test("announces 'Theme: Auto' when Auto radio clicked", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  await renderNav({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Auto");
  });
  cleanup();
});
