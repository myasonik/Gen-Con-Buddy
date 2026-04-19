import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Link,
  createRootRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { Button } from "./Button";

async function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{ui}</> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("defaults type to button to prevent accidental form submission", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts type='submit'", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"), {
      pointerEventsCheck: 0,
    });
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe("Button render prop", () => {
  it("renders as a link when given a Link render element", async () => {
    await renderWithRouter(<Button render={<Link to="/" />}>Back</Button>);
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  });

  it("navigates to the given route via render prop", async () => {
    await renderWithRouter(
      <Button render={<Link to="/" />}>Back to results</Button>,
    );
    expect(
      screen.getByRole("link", { name: "Back to results" }),
    ).toHaveAttribute("href", "/");
  });
});
