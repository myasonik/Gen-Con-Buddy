import React from "react";
import { expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import type { FacetResponse } from "../../utils/types";
import { FacetMultiSelect } from "./FacetMultiSelect";

const LOCATION_FACETS: FacetResponse = {
  values: [
    { value: "ICC", count: 312 },
    { value: "Marriott Ballroom", count: 87 },
    { value: "Westin Hotel", count: 45 },
  ],
};

beforeEach(() => {
  server.use(http.get("/api/events/facets/location", () => HttpResponse.json(LOCATION_FACETS)));
});

function renderFacetMultiSelect(
  value = "",
  onValueChange: (v: string) => void = vi.fn<(v: string) => void>(),
): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <FacetMultiSelect
          field="location"
          label="Location"
          value={value}
          onValueChange={onValueChange}
        />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

test("renders combobox with given label", async () => {
  renderFacetMultiSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Location" })).toBeInTheDocument(),
  );
});

test("shows loading state while fetching facets", () => {
  renderFacetMultiSelect();
  expect(screen.getByRole("combobox", { name: "Location" })).toBeDisabled();
});

test("renders options from API response after loading", async () => {
  const user = userEvent.setup();
  renderFacetMultiSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Location" })).not.toBeDisabled(),
  );
  await user.click(screen.getByRole("combobox", { name: "Location" }));
  expect(screen.getByRole("option", { name: "ICC" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Marriott Ballroom" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Westin Hotel" })).toBeInTheDocument();
});

test("shows event count alongside each option", async () => {
  const user = userEvent.setup();
  renderFacetMultiSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Location" })).not.toBeDisabled(),
  );
  await user.click(screen.getByRole("combobox", { name: "Location" }));
  expect(screen.getByRole("option", { name: "ICC" })).toHaveTextContent("312");
  expect(screen.getByRole("option", { name: "Marriott Ballroom" })).toHaveTextContent("87");
});

test("selecting a value calls onValueChange with that value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  renderFacetMultiSelect("", handleChange);
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Location" })).not.toBeDisabled(),
  );
  await user.click(screen.getByRole("combobox", { name: "Location" }));
  await user.click(screen.getByRole("option", { name: "ICC" }));
  expect(handleChange).toHaveBeenCalledWith("ICC");
});

test("selecting multiple values joins them with a comma", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  renderFacetMultiSelect("ICC", handleChange);
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Location" })).not.toBeDisabled(),
  );
  await user.click(screen.getByRole("combobox", { name: "Location" }));
  await user.click(screen.getByRole("option", { name: "Marriott Ballroom" }));
  expect(handleChange).toHaveBeenCalledWith("ICC,Marriott Ballroom");
});

test("pre-filled value renders a chip before options load", () => {
  renderFacetMultiSelect("ICC");
  expect(screen.getByRole("button", { name: "Remove ICC" })).toBeInTheDocument();
});

test("type-to-filter narrows the options list", async () => {
  const user = userEvent.setup();
  renderFacetMultiSelect();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Location" })).not.toBeDisabled(),
  );
  await user.click(screen.getByRole("combobox", { name: "Location" }));
  await user.type(screen.getByRole("combobox", { name: "Location" }), "marriott");
  expect(screen.getByRole("option", { name: "Marriott Ballroom" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "ICC" })).not.toBeInTheDocument();
});

test("renders null when the API returns a network error", async () => {
  server.use(http.get("/api/events/facets/location", () => HttpResponse.error()));
  const { container } = renderFacetMultiSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("renders null when the API returns an HTTP error", async () => {
  server.use(
    http.get("/api/events/facets/location", () => new HttpResponse(null, { status: 500 })),
  );
  const { container } = renderFacetMultiSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("renders null when API returns 200 with error field", async () => {
  server.use(
    http.get("/api/events/facets/location", () =>
      HttpResponse.json<FacetResponse>({ error: "Service unavailable" }),
    ),
  );
  const { container } = renderFacetMultiSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});
