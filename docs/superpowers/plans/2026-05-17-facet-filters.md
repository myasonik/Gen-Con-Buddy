# Facet-backed Filter Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static/plain filter controls with live facet-backed components for 7 new fields, and generalize the existing `GameSystemSelect` pattern into reusable `FacetMultiSelect` and `FacetSelect` components.

**Architecture:** A generic `fetchFacets(field)` API function feeds two new components. `FacetMultiSelect` wraps `MultiCombobox` for multi-value text fields (`gameSystem`, `group`, `location`, `roomName`). `FacetSelect` wraps `Select` for single-value enum fields (`ageRequired`, `experienceRequired`, `attendeeRegistration`, `specialCategory`), mapping raw backend values to labels via a `labelMap` prop. `GameSystemSelect` is deleted once `FacetMultiSelect` takes over.

**Tech Stack:** React, TanStack Query (`useQuery`), MSW (test network mocking), Vitest + Testing Library

---

## File map

| Action | Path                                                          |
| ------ | ------------------------------------------------------------- |
| Modify | `src/utils/types.ts`                                          |
| Modify | `src/utils/api.ts`                                            |
| Modify | `src/utils/api.test.ts`                                       |
| Modify | `src/test/msw/handlers.ts`                                    |
| Create | `src/components/FacetMultiSelect/FacetMultiSelect.tsx`        |
| Create | `src/components/FacetMultiSelect/FacetMultiSelect.module.css` |
| Create | `src/components/FacetMultiSelect/FacetMultiSelect.test.tsx`   |
| Create | `src/components/FacetSelect/FacetSelect.tsx`                  |
| Create | `src/components/FacetSelect/FacetSelect.module.css`           |
| Create | `src/components/FacetSelect/FacetSelect.test.tsx`             |
| Modify | `src/components/SearchForm/SearchForm.tsx`                    |
| Modify | `src/components/SearchForm/SearchForm.test.tsx`               |
| Delete | `src/components/GameSystemSelect/GameSystemSelect.tsx`        |
| Delete | `src/components/GameSystemSelect/GameSystemSelect.module.css` |
| Delete | `src/components/GameSystemSelect/GameSystemSelect.test.tsx`   |
| Modify | `src/utils/filterFields.ts` (remove `enumOptions`)            |

---

## Task 1: Add `FacetValue`/`FacetResponse` types and `fetchFacets`

**Files:**

- Modify: `src/utils/types.ts`
- Modify: `src/utils/api.ts`
- Modify: `src/utils/api.test.ts`

- [ ] **Step 1: Write failing tests for `fetchFacets` in `api.test.ts`**

Add these tests at the bottom of `src/utils/api.test.ts` (leave existing `fetchGameSystemFacets` tests in place for now — they are removed in Task 6):

```ts
// fetchFacets

test("fetchFacets returns values for a given field on success", async () => {
  server.use(
    http.get("/api/events/facets/location", () =>
      HttpResponse.json<FacetResponse>({
        values: [
          { value: "ICC", count: 312 },
          { value: "Marriott Ballroom", count: 87 },
        ],
      }),
    ),
  );
  const result = await fetchFacets("location");
  expect(result).toStrictEqual([
    { value: "ICC", count: 312 },
    { value: "Marriott Ballroom", count: 87 },
  ]);
});

test("fetchFacets throws on HTTP error", async () => {
  server.use(
    http.get("/api/events/facets/location", () => new HttpResponse(null, { status: 500 })),
  );
  await expect(fetchFacets("location")).rejects.toThrow("HTTP 500");
});

test("fetchFacets throws when response contains error field", async () => {
  server.use(
    http.get("/api/events/facets/location", () =>
      HttpResponse.json<FacetResponse>({ error: "unavailable" }),
    ),
  );
  await expect(fetchFacets("location")).rejects.toThrow("unavailable");
});

test("fetchFacets returns empty array when values is absent from response", async () => {
  server.use(http.get("/api/events/facets/location", () => HttpResponse.json<FacetResponse>({})));
  const result = await fetchFacets("location");
  expect(result).toStrictEqual([]);
});
```

Also add the `FacetResponse` import to the top of `api.test.ts` — you'll add it to the import from `./types` in Step 4.

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test -- src/utils/api.test.ts
```

Expected: 4 new tests fail with `fetchFacets is not a function` (or similar import error). Existing tests pass.

- [ ] **Step 3: Add `FacetValue` and `FacetResponse` to `src/utils/types.ts`**

Add these two interfaces after the existing `SortState` export (keep `GameSystemFacet` and `GameSystemFacetsResponse` — they are removed in Task 6):

```ts
export interface FacetValue {
  value: string;
  count: number;
}

export interface FacetResponse {
  error?: string;
  values?: FacetValue[];
}
```

- [ ] **Step 4: Add `fetchFacets` to `src/utils/api.ts` and update the import in `api.test.ts`**

In `src/utils/api.ts`, add this import at the top (alongside the existing types import):

```ts
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  GameSystemFacet,
  GameSystemFacetsResponse,
  FacetValue,
  FacetResponse,
} from "./types";
```

Then add the function at the bottom of `api.ts` (keep `fetchGameSystemFacets` — removed in Task 6):

```ts
export async function fetchFacets(field: string): Promise<FacetValue[]> {
  const url = new URL(`/api/events/facets/${field}`, window.location.origin);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as FacetResponse;
  if (data.error) {
    throw new Error(data.error);
  }
  return data.values ?? [];
}
```

In `src/utils/api.test.ts`, update the import line:

```ts
import {
  fetchEvents,
  fetchChangelogList,
  fetchChangelogEntry,
  fetchGameSystemFacets,
  fetchFacets,
} from "./api";
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  GameSystemFacetsResponse,
  FacetResponse,
} from "./types";
```

- [ ] **Step 5: Run tests to confirm all pass**

```bash
npm test -- src/utils/api.test.ts
```

Expected: All tests pass including the 4 new `fetchFacets` tests.

- [ ] **Step 6: Commit**

```bash
git add src/utils/types.ts src/utils/api.ts src/utils/api.test.ts
git commit -m "feat(api): add FacetValue/FacetResponse types and fetchFacets"
```

---

## Task 2: Update MSW handler to generic facets endpoint

**Files:**

- Modify: `src/test/msw/handlers.ts`
- Modify: `src/utils/api.test.ts`

- [ ] **Step 1: Replace the specific gameSystem handler with a generic `:field` handler in `handlers.ts`**

Update the import at the top of `src/test/msw/handlers.ts`:

```ts
import type {
  Event,
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  FacetResponse,
} from "../../utils/types";
```

Replace the specific `http.get("/api/events/facets/gameSystem", ...)` entry in the `handlers` array with:

```ts
http.get("/api/events/facets/:field", ({ params }) => {
  const field = params.field as string;
  const gameSystemValues: FacetResponse["values"] = [
    { value: "Dungeons & Dragons 5E", count: 142 },
    { value: "Pathfinder 2E", count: 87 },
    { value: "Call of Cthulhu", count: 45 },
  ];
  const response: FacetResponse = {
    values:
      field === "gameSystem"
        ? gameSystemValues
        : [
            { value: "alpha", count: 100 },
            { value: "beta", count: 50 },
          ],
  };
  return HttpResponse.json(response);
}),
```

Also remove the `GameSystemFacetsResponse` import — it is no longer used in `handlers.ts`.

- [ ] **Step 2: Update `fetchGameSystemFacets` tests in `api.test.ts` to use `fetchFacets("gameSystem")`**

The existing `fetchGameSystemFacets` tests in `api.test.ts` now use the generic handler. Replace all four `fetchGameSystemFacets` tests (the `// fetchGameSystemFacets` comment block through the last test that references `fetchGameSystemFacets`) with one equivalent `fetchFacets` test against the default handler. The HTTP error, error-field, and empty-values cases are already covered by the four tests added in Task 1.

```ts
// fetchFacets (gameSystem via default handler)

test("fetchFacets returns gameSystem values from default handler", async () => {
  const result = await fetchFacets("gameSystem");
  expect(result).toStrictEqual([
    { value: "Dungeons & Dragons 5E", count: 142 },
    { value: "Pathfinder 2E", count: 87 },
    { value: "Call of Cthulhu", count: 45 },
  ]);
});
```

Remove the old `fetchGameSystemFacets` import from the `api.test.ts` import line (keep `fetchFacets`):

```ts
import { fetchEvents, fetchChangelogList, fetchChangelogEntry, fetchFacets } from "./api";
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  FacetResponse,
} from "./types";
```

Keep the four tests added in Task 1 Step 1 — they use explicit `server.use` overrides and cover paths that the default-handler test does not (HTTP 500, error field, empty values). Do not remove them.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests pass. No references to `fetchGameSystemFacets` remain in tests.

- [ ] **Step 4: Commit**

```bash
git add src/test/msw/handlers.ts src/utils/api.test.ts
git commit -m "test(msw): replace per-field facets handler with generic :field handler"
```

---

## Task 3: Build `FacetMultiSelect`

**Files:**

- Create: `src/components/FacetMultiSelect/FacetMultiSelect.test.tsx`
- Create: `src/components/FacetMultiSelect/FacetMultiSelect.module.css`
- Create: `src/components/FacetMultiSelect/FacetMultiSelect.tsx`

- [ ] **Step 1: Write the test file**

Create `src/components/FacetMultiSelect/FacetMultiSelect.test.tsx`:

```tsx
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

test("renders null when API returns 200 with error field", async () => {
  server.use(
    http.get("/api/events/facets/location", () =>
      HttpResponse.json<FacetResponse>({ error: "Service unavailable" }),
    ),
  );
  const { container } = renderFacetMultiSelect();
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npm test -- src/components/FacetMultiSelect/FacetMultiSelect.test.tsx
```

Expected: All tests fail with `Cannot find module './FacetMultiSelect'`.

- [ ] **Step 3: Create the CSS module**

Create `src/components/FacetMultiSelect/FacetMultiSelect.module.css`:

```css
.optionName {
  composes: itemName from "../../ui/MultiCombobox/MultiCombobox.module.css";
}

.optionCount {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  flex-shrink: 0;
}
```

- [ ] **Step 4: Implement the component**

Create `src/components/FacetMultiSelect/FacetMultiSelect.tsx`:

```tsx
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "../../ui/MultiCombobox/MultiCombobox";
import { fetchFacets } from "../../utils/api";
import styles from "./FacetMultiSelect.module.css";

export interface FacetMultiSelectProps {
  field: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function FacetMultiSelect({
  field,
  label,
  value,
  onValueChange,
}: FacetMultiSelectProps): React.JSX.Element | null {
  const {
    data: facets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["facets", field],
    queryFn: () => fetchFacets(field),
    staleTime: Infinity,
  });

  const countMap = useMemo(() => new Map((facets ?? []).map((f) => [f.value, f.count])), [facets]);

  const options = useMemo(
    () => (facets ?? []).map((f) => ({ value: f.value, label: f.value })),
    [facets],
  );

  if (isError) return null;

  return (
    <MultiCombobox
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      isLoading={isLoading}
      renderOptionContent={(option) => {
        const count = countMap.get(option.value);
        return (
          <>
            <span className={styles.optionName}>{option.label}</span>
            {count !== undefined && (
              <span className={styles.optionCount} aria-hidden="true">
                {count}
              </span>
            )}
          </>
        );
      }}
    />
  );
}
```

- [ ] **Step 5: Run tests to confirm they all pass**

```bash
npm test -- src/components/FacetMultiSelect/FacetMultiSelect.test.tsx
```

Expected: All 10 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FacetMultiSelect/
git commit -m "feat(FacetMultiSelect): generic facet-backed multi-select combobox"
```

---

## Task 4: Build `FacetSelect`

**Files:**

- Create: `src/components/FacetSelect/FacetSelect.test.tsx`
- Create: `src/components/FacetSelect/FacetSelect.module.css`
- Create: `src/components/FacetSelect/FacetSelect.tsx`

- [ ] **Step 1: Write the test file**

Create `src/components/FacetSelect/FacetSelect.test.tsx`:

```tsx
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

test("renders null when the API returns a network error", async () => {
  server.use(http.get("/api/events/facets/ageRequired", () => HttpResponse.error()));
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
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npm test -- src/components/FacetSelect/FacetSelect.test.tsx
```

Expected: All tests fail with `Cannot find module './FacetSelect'`.

- [ ] **Step 3: Create the CSS module**

Create `src/components/FacetSelect/FacetSelect.module.css`:

```css
.label {
  composes: eyebrow from "../../styles/eyebrow.module.css";
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  line-height: 1;
}
```

- [ ] **Step 4: Implement the component**

Create `src/components/FacetSelect/FacetSelect.tsx`:

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Select } from "../../ui/Select/Select";
import { fetchFacets } from "../../utils/api";
import styles from "./FacetSelect.module.css";

export interface FacetSelectProps {
  field: string;
  label: string;
  labelMap: Record<string, string>;
  value: string;
  onValueChange: (value: string) => void;
}

export function FacetSelect({
  field,
  label,
  labelMap,
  value,
  onValueChange,
}: FacetSelectProps): React.JSX.Element | null {
  const { data: facets, isError } = useQuery({
    queryKey: ["facets", field],
    queryFn: () => fetchFacets(field),
    staleTime: Infinity,
  });

  if (isError) return null;

  const options = (facets ?? []).map((f) => ({
    value: f.value,
    label: `${labelMap[f.value] ?? f.value} (${f.count})`,
  }));

  return (
    <label className={styles.label}>
      {label}
      <Select value={value} onValueChange={onValueChange} options={options} />
    </label>
  );
}
```

- [ ] **Step 5: Run tests to confirm they all pass**

```bash
npm test -- src/components/FacetSelect/FacetSelect.test.tsx
```

Expected: All 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FacetSelect/
git commit -m "feat(FacetSelect): generic facet-backed single-select with label mapping"
```

---

## Task 5: Wire new components into `SearchForm`

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Update the failing test cases in `SearchForm.test.tsx`**

Find the test `"renders advanced filter fields in the form"`. The current assertion checks for a textbox named "Location". After the change, Location becomes a combobox. Update the assertions:

```ts
test("renders advanced filter fields in the form", async () => {
  const user = userEvent.setup();
  renderSearchForm();
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Game ID" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Location" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Materials Required Details" })).toBeInTheDocument();
});
```

Also add tests for the new comboboxes and the moved "Group" field. Add these new tests:

```ts
test("renders Group, Location, Room Name as facet comboboxes in the Logistics section", async () => {
  const user = userEvent.setup();
  renderSearchForm();
  await user.click(screen.getByRole("button", { name: "Filters" }));
  await waitFor(() => {
    expect(screen.getByRole("combobox", { name: "Group" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Location" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Room Name" })).toBeInTheDocument();
  });
});

test("renders Age Required, Experience Required, Attendee Registration, Special Category as facet selects", async () => {
  const user = userEvent.setup();
  renderSearchForm();
  await user.click(screen.getByRole("button", { name: "Filters" }));
  await waitFor(() => {
    expect(screen.getByRole("combobox", { name: "Age Required" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Experience Required" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Attendee Registration" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Special Category" })).toBeInTheDocument();
  });
});
```

Add `waitFor` to the import if not already present.

- [ ] **Step 2: Run tests to confirm the modified test fails**

```bash
npm test -- src/components/SearchForm/SearchForm.test.tsx
```

Expected: The `"renders advanced filter fields in the form"` test and any tests checking "Location" as a textbox fail.

- [ ] **Step 3: Update `SearchForm.tsx`**

Replace the imports at the top — remove `GameSystemSelect`, add the two new components and enums:

```tsx
import { FacetMultiSelect } from "../FacetMultiSelect/FacetMultiSelect";
import { FacetSelect } from "../FacetSelect/FacetSelect";
import { AGE_GROUPS, CATEGORY, EXP, REGISTRATION } from "../../utils/enums";
```

Remove this import line entirely (or remove `enumOptions` from it):

```tsx
import { enumOptions } from "../../utils/filterFields";
```

In the **Session** section, replace the two `<label>` + `<Select>` blocks for `ageRequired` and `experienceRequired`:

```tsx
<FacetSelect
  field="ageRequired"
  label="Age Required"
  labelMap={AGE_GROUPS}
  value={watch("ageRequired") ?? ""}
  onValueChange={(v) => setValue("ageRequired", v)}
/>
<FacetSelect
  field="experienceRequired"
  label="Experience Required"
  labelMap={EXP}
  value={watch("experienceRequired") ?? ""}
  onValueChange={(v) => setValue("experienceRequired", v)}
/>
```

In the **Logistics** section, replace `<Field label="Location" ...>` and `<Field label="Room Name" ...>` with `FacetMultiSelect`, and add `group` here (remove it from the Details section below). Replace the entire Logistics fieldsetBody content:

```tsx
<div className={styles.fieldsetBody}>
  <FacetMultiSelect
    field="group"
    label="Group"
    value={watch("group") ?? ""}
    onValueChange={(v) => setValue("group", v)}
  />
  <FacetMultiSelect
    field="location"
    label="Location"
    value={watch("location") ?? ""}
    onValueChange={(v) => setValue("location", v)}
  />
  <FacetMultiSelect
    field="roomName"
    label="Room Name"
    value={watch("roomName") ?? ""}
    onValueChange={(v) => setValue("roomName", v)}
  />
  <Field label="Table" inputProps={register("tableNumber")} />
  <RangeField label="Cost">
    <Input type="number" min="0" {...register("costMin")} />
    <Input type="number" min="0" {...register("costMax")} />
  </RangeField>
  <RangeField label="Tickets Available">
    <Input type="number" min="0" {...register("ticketsAvailableMin")} />
    <Input type="number" min="0" {...register("ticketsAvailableMax")} />
  </RangeField>
  <FacetSelect
    field="attendeeRegistration"
    label="Attendee Registration"
    labelMap={REGISTRATION}
    value={watch("attendeeRegistration") ?? ""}
    onValueChange={(v) => setValue("attendeeRegistration", v)}
  />
</div>
```

In the **Game** section, replace `<GameSystemSelect ...>` with `FacetMultiSelect`:

```tsx
<FacetMultiSelect
  field="gameSystem"
  label="Game System"
  value={watch("gameSystem") ?? ""}
  onValueChange={(v) => setValue("gameSystem", v)}
/>
```

Replace the `specialCategory` `<label>` + `<Select>` block with:

```tsx
<FacetSelect
  field="specialCategory"
  label="Special Category"
  labelMap={CATEGORY}
  value={watch("specialCategory") ?? ""}
  onValueChange={(v) => setValue("specialCategory", v)}
/>
```

In the **Details** section, remove the `<Field label="Group" ...>` line (group moved to Logistics above).

- [ ] **Step 4: Run tests to confirm all pass**

```bash
npm test -- src/components/SearchForm/SearchForm.test.tsx
```

Expected: All tests pass.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat(SearchForm): wire FacetMultiSelect and FacetSelect for 7 new facet fields"
```

---

## Task 6: Delete `GameSystemSelect` and remove old code

**Files:**

- Delete: `src/components/GameSystemSelect/` (entire directory)
- Modify: `src/utils/types.ts`
- Modify: `src/utils/api.ts`
- Modify: `src/utils/api.test.ts`
- Modify: `src/utils/filterFields.ts`

- [ ] **Step 1: Delete the `GameSystemSelect` directory**

```bash
rm -rf src/components/GameSystemSelect
```

- [ ] **Step 2: Remove old types from `src/utils/types.ts`**

Delete the two interfaces that are now unused:

```ts
// Remove these:
export interface GameSystemFacet {
  value: string;
  count: number;
}

export interface GameSystemFacetsResponse {
  error?: string;
  values?: GameSystemFacet[];
}
```

- [ ] **Step 3: Remove `fetchGameSystemFacets` from `src/utils/api.ts`**

Delete the `fetchGameSystemFacets` function and remove `GameSystemFacet` and `GameSystemFacetsResponse` from the import at the top of `api.ts`. The import becomes:

```ts
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  FacetValue,
  FacetResponse,
} from "./types";
```

- [ ] **Step 4: Clean up `src/utils/api.test.ts`**

Remove the `GameSystemFacetsResponse` type from the import (already done in Task 2, but verify it is gone). Also remove the `fetchGameSystemFacets returns gameSystem values from default handler` test added in Task 2 if you prefer a single clean `fetchFacets` test, or leave it — it still works with the generic handler.

- [ ] **Step 5: Remove `enumOptions` from `src/utils/filterFields.ts`**

Delete the `enumOptions` export at the bottom of `filterFields.ts`:

```ts
// Remove this entire function:
/** Returns select-ready options for an enum field. */
export function enumOptions(key: FilterableKey): { value: string; label: string }[] {
  const d = FILTER_FIELDS[key];
  if (d.type !== "enum") {
    return [];
  }
  return Object.entries(d.options).map(([value, label]) => ({ value, label }));
}
```

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: All tests pass. TypeScript should have no errors referencing the deleted symbols (`tsc` runs as part of the pre-commit hook).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: delete GameSystemSelect; remove fetchGameSystemFacets, old facet types, enumOptions"
```
