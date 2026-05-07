import { expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { GameSystemSelect } from "./GameSystemSelect";

function renderGameSystemSelect(
  value = "",
  onValueChange: (v: string) => void = vi.fn<(v: string) => void>(),
): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GameSystemSelect value={value} onValueChange={onValueChange} />
    </QueryClientProvider>,
  );
}

test("renders Game System label and combobox", async () => {
  renderGameSystemSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).toBeInTheDocument(),
  );
});

test("shows loading state while fetching facets", () => {
  renderGameSystemSelect();
  expect(screen.getByRole("combobox", { name: "Game System" })).toBeDisabled();
});

test("renders options from API response after loading", async () => {
  const user = userEvent.setup();
  renderGameSystemSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).not.toBeDisabled(),
  );

  await user.click(screen.getByRole("combobox", { name: "Game System" }));

  expect(screen.getByRole("option", { name: "Dungeons & Dragons 5E" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Pathfinder 2E" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Call of Cthulhu" })).toBeInTheDocument();
});

test("shows event count alongside each option", async () => {
  const user = userEvent.setup();
  renderGameSystemSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).not.toBeDisabled(),
  );

  await user.click(screen.getByRole("combobox", { name: "Game System" }));

  expect(screen.getByRole("option", { name: "Dungeons & Dragons 5E" })).toHaveTextContent("142");
  expect(screen.getByRole("option", { name: "Pathfinder 2E" })).toHaveTextContent("87");
});

test("selecting a game system calls onValueChange with the exact value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  renderGameSystemSelect("", handleChange);
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).not.toBeDisabled(),
  );

  await user.click(screen.getByRole("combobox", { name: "Game System" }));
  await user.click(screen.getByRole("option", { name: "Pathfinder 2E" }));

  expect(handleChange).toHaveBeenCalledWith("Pathfinder 2E");
});

test("selecting multiple systems joins them with a comma", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  renderGameSystemSelect("Dungeons & Dragons 5E", handleChange);
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).not.toBeDisabled(),
  );

  await user.click(screen.getByRole("combobox", { name: "Game System" }));
  await user.click(screen.getByRole("option", { name: "Pathfinder 2E" }));

  expect(handleChange).toHaveBeenCalledWith("Dungeons & Dragons 5E,Pathfinder 2E");
});

test("renders null when the API returns an error", async () => {
  server.use(http.get("/api/events/facets/gameSystem", () => HttpResponse.error()));
  const { container } = renderGameSystemSelect();

  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("pre-filled value renders a chip before options load", () => {
  renderGameSystemSelect("Dungeons & Dragons 5E");

  expect(screen.getByRole("button", { name: "Remove Dungeons & Dragons 5E" })).toBeInTheDocument();
});

test("type-to-filter narrows the options list", async () => {
  const user = userEvent.setup();
  renderGameSystemSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).not.toBeDisabled(),
  );

  await user.click(screen.getByRole("combobox", { name: "Game System" }));
  await user.type(screen.getByRole("combobox", { name: "Game System" }), "path");

  expect(screen.getByRole("option", { name: "Pathfinder 2E" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Dungeons & Dragons 5E" })).not.toBeInTheDocument();
});

test("renders null when API returns 200 with error field", async () => {
  server.use(
    http.get("/api/events/facets/gameSystem", () =>
      HttpResponse.json({ error: "Service unavailable" }),
    ),
  );
  const { container } = renderGameSystemSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("pre-filled value not in facets renders chip using raw value as label", async () => {
  renderGameSystemSelect("Obscure System");
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).not.toBeDisabled(),
  );
  expect(screen.getByRole("button", { name: "Remove Obscure System" })).toBeInTheDocument();
});
