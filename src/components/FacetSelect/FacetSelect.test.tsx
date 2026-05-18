import React from "react";
import { expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import type { FacetResponse } from "../../utils/types";
import { AGE_GROUPS } from "../../utils/enums";
import { FacetSelect } from "./FacetSelect";

const AGE_FACETS: FacetResponse = {
  values: [
    { value: "everyone", count: 412 },
    { value: "mature", count: 87 },
    { value: "teen", count: 45 },
    { value: "unknown_raw_value", count: 5 },
  ],
};

beforeEach(() => {
  server.use(http.get("/api/events/facets/ageRequired", () => HttpResponse.json(AGE_FACETS)));
});

function renderFacetSelect(
  value = "",
  onValueChange: (v: string) => void = vi.fn<(v: string) => void>(),
): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <FacetSelect
          field="ageRequired"
          label="Age Required"
          labelMap={AGE_GROUPS}
          value={value}
          onValueChange={onValueChange}
        />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

test("renders label and select", async () => {
  renderFacetSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Age Required" })).toBeInTheDocument(),
  );
});

test("renders options with mapped labels and counts after loading", async () => {
  renderFacetSelect();
  await waitFor(() =>
    expect(screen.getByRole("option", { name: "Everyone (6+) (412)" })).toBeInTheDocument(),
  );
  expect(screen.getByRole("option", { name: "Mature (18+) (87)" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Teen (13+) (45)" })).toBeInTheDocument();
});

test("falls back to raw value for unmapped backend values", async () => {
  renderFacetSelect();
  await waitFor(() =>
    expect(screen.getByRole("option", { name: "unknown_raw_value (5)" })).toBeInTheDocument(),
  );
});

test("selecting an option calls onValueChange with the raw backend value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  renderFacetSelect("", handleChange);
  await waitFor(() =>
    expect(screen.getByRole("option", { name: "Everyone (6+) (412)" })).toBeInTheDocument(),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Age Required" }),
    screen.getByRole("option", { name: "Everyone (6+) (412)" }),
  );
  expect(handleChange).toHaveBeenCalledWith("everyone");
});

test("shows only placeholder while loading", () => {
  renderFacetSelect();
  expect(screen.queryByRole("option", { name: "Everyone (6+) (412)" })).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Any" })).toBeInTheDocument();
});

test("select is disabled while loading", () => {
  renderFacetSelect();
  expect(screen.getByRole("combobox", { name: "Age Required" })).toBeDisabled();
});

test("renders null when the API returns a network error", async () => {
  server.use(http.get("/api/events/facets/ageRequired", () => HttpResponse.error()));
  const { container } = renderFacetSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("renders null when the API returns an HTTP error", async () => {
  server.use(
    http.get("/api/events/facets/ageRequired", () => new HttpResponse(null, { status: 500 })),
  );
  const { container } = renderFacetSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("renders null when API returns 200 with error field", async () => {
  server.use(
    http.get("/api/events/facets/ageRequired", () =>
      HttpResponse.json<FacetResponse>({ error: "Service unavailable" }),
    ),
  );
  const { container } = renderFacetSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});
