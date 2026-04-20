# Event Type Multi-Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-select Event Type `<select>` with a typeahead multi-select combobox that shows colored chips — short codes when closed, full names when open.

**Architecture:** New `EventTypeSelect` ui component wraps `@base-ui/react/combobox`. Selection stored as comma-separated codes in `SearchFormValues.eventType` (same pattern as `days`). `api.ts` serializes each code to its full label before sending.

**Tech Stack:** `@base-ui/react/combobox`, React Hook Form `setValue`, CSS Modules, Vitest + Testing Library, MSW

---

## File Map

| File                                                | Action | Responsibility                          |
| --------------------------------------------------- | ------ | --------------------------------------- |
| `src/utils/api.test.ts`                             | Create | Tests for eventType serialization       |
| `src/utils/api.ts`                                  | Modify | Multi-value eventType serialization     |
| `src/ui/EventTypeSelect/EventTypeSelect.tsx`        | Create | Combobox UI component                   |
| `src/ui/EventTypeSelect/EventTypeSelect.module.css` | Create | Component styles                        |
| `src/ui/EventTypeSelect/EventTypeSelect.test.tsx`   | Create | Component unit tests                    |
| `src/components/SearchForm/SearchForm.tsx`          | Modify | Replace `<select>` with EventTypeSelect |
| `src/components/SearchForm/SearchForm.test.tsx`     | Modify | Update tests broken by the swap         |

---

### Task 1: Fix eventType serialization in api.ts

**Files:**

- Create: `src/utils/api.test.ts`
- Modify: `src/utils/api.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/api.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { server } from "../test/msw/server";
import { fetchEvents } from "./api";
import type { EventSearchResponse } from "./types";

const EMPTY_RESPONSE: EventSearchResponse = {
  data: [],
  meta: { total: 0 },
  links: { self: "/api/events/search" },
  error: null,
};

function captureUrl(): { getUrl: () => URL | null } {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json(EMPTY_RESPONSE);
    }),
  );
  return { getUrl: () => capturedUrl };
}

test("serializes single eventType code as full label", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "BGM" });
  expect(getUrl()?.searchParams.get("eventType")).toBe("BGM - Board Game");
});

test("serializes multiple eventType codes as comma-separated full labels", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "RPG,BGM" });
  expect(getUrl()?.searchParams.get("eventType")).toBe(
    "RPG - Role Playing Game,BGM - Board Game",
  );
});

test("omits eventType when value is empty string", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "" });
  expect(getUrl()?.searchParams.has("eventType")).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/api.test.ts
```

Expected: FAIL — "serializes multiple eventType codes" fails because `EVENT_TYPES["RPG,BGM"]` is `undefined`, so it falls back to the raw string `"RPG,BGM"` instead of mapping each code.

- [ ] **Step 3: Fix api.ts**

In `src/utils/api.ts`, replace lines 28–30:

```ts
if (key === "eventType" && typeof value === "string") {
  url.searchParams.set(key, EVENT_TYPES[value] ?? value);
}
```

with:

```ts
if (key === "eventType" && typeof value === "string") {
  const labels = value
    .split(",")
    .map((code) => EVENT_TYPES[code] ?? code)
    .join(",");
  url.searchParams.set(key, labels);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/api.test.ts
```

Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/api.ts src/utils/api.test.ts
git commit -m "feat(api): serialize multiple eventType codes as comma-separated full labels"
```

---

### Task 2: Write failing EventTypeSelect tests

**Files:**

- Create: `src/ui/EventTypeSelect/EventTypeSelect.test.tsx`

- [ ] **Step 1: Create the test file**

Create `src/ui/EventTypeSelect/EventTypeSelect.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventTypeSelect } from "./EventTypeSelect";

test("renders the Event Type label and combobox input", () => {
  render(<EventTypeSelect value="" onValueChange={() => {}} />);
  expect(
    screen.getByRole("combobox", { name: "Event Type" }),
  ).toBeInTheDocument();
});

test("shows no chip remove buttons when value is empty", () => {
  render(<EventTypeSelect value="" onValueChange={() => {}} />);
  expect(
    screen.queryByRole("button", { name: /^Remove/ }),
  ).not.toBeInTheDocument();
});

test("shows short code chips for selected values when closed", () => {
  render(<EventTypeSelect value="RPG,BGM" onValueChange={() => {}} />);
  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const bgmRemove = screen.getByRole("button", { name: "Remove BGM" });
  expect(rpgRemove.closest("[data-testid=chip]")).toHaveTextContent("RPG");
  expect(rpgRemove.closest("[data-testid=chip]")).not.toHaveTextContent(
    "Role Playing Game",
  );
  expect(bgmRemove.closest("[data-testid=chip]")).toHaveTextContent("BGM");
  expect(bgmRemove.closest("[data-testid=chip]")).not.toHaveTextContent(
    "Board Game",
  );
});

test("chips expand to show full name when dropdown is open", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));

  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  expect(rpgRemove.closest("[data-testid=chip]")).toHaveTextContent(
    "Role Playing Game",
  );
});

test("selecting an option calls onValueChange with that code", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();
  render(<EventTypeSelect value="" onValueChange={handleChange} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.click(screen.getByRole("option", { name: /Board Game/ }));

  expect(handleChange).toHaveBeenCalledWith("BGM");
});

test("selecting a second option appends it to the value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();
  render(<EventTypeSelect value="RPG" onValueChange={handleChange} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.click(screen.getByRole("option", { name: /Board Game/ }));

  expect(handleChange).toHaveBeenCalledWith("RPG,BGM");
});

test("selecting an already-selected option removes it from the value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();
  render(<EventTypeSelect value="RPG,BGM" onValueChange={handleChange} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.click(screen.getByRole("option", { name: /Board Game/ }));

  expect(handleChange).toHaveBeenCalledWith("RPG");
});

test("filter text narrows options by code", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.type(screen.getByRole("combobox", { name: "Event Type" }), "RPG");

  expect(
    screen.getByRole("option", { name: /Role Playing Game/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /Board Game/ }),
  ).not.toBeInTheDocument();
});

test("filter text narrows options by name", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.type(screen.getByRole("combobox", { name: "Event Type" }), "mini");

  expect(
    screen.getByRole("option", { name: /Historical Miniatures/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /Board Game/ }),
  ).not.toBeInTheDocument();
});

test("removing a chip calls onValueChange without that code", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();
  render(<EventTypeSelect value="RPG,BGM" onValueChange={handleChange} />);

  await user.click(screen.getByRole("button", { name: "Remove RPG" }));

  expect(handleChange).toHaveBeenCalledWith("BGM");
});
```

- [ ] **Step 2: Run tests to verify they all fail**

```bash
npx vitest run src/ui/EventTypeSelect/EventTypeSelect.test.tsx
```

Expected: FAIL — "Cannot find module './EventTypeSelect'"

---

### Task 3: Implement EventTypeSelect

**Files:**

- Create: `src/ui/EventTypeSelect/EventTypeSelect.module.css`
- Create: `src/ui/EventTypeSelect/EventTypeSelect.tsx`

- [ ] **Step 1: Create the CSS module**

Create `src/ui/EventTypeSelect/EventTypeSelect.module.css`:

```css
.root {
  margin-bottom: var(--space-2);
}

.label {
  display: block;
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-bark);
  margin-bottom: var(--space-1);
  letter-spacing: 0.03em;
}

.inputGroup {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-parchment-light);
  border: 1px solid var(--color-bark-light);
  border-radius: 3px;
  cursor: text;
  min-height: 34px;
}

.inputGroup:focus-within {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.chips {
  display: contents;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 1px var(--space-1) 1px var(--space-2);
  border-radius: 4px;
  border: 1.5px solid var(--chip-color, var(--color-bark));
  background: var(--chip-bg, var(--color-parchment));
  font-family: var(--font-display);
  font-size: var(--text-badge);
  font-style: italic;
  font-weight: 700;
  color: var(--chip-color, var(--color-bark));
  white-space: nowrap;
}

.chipRemove {
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 0 2px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
}

.chipRemove:hover {
  opacity: 1;
}

.input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: none;
  font-family: var(--font-body);
  font-size: var(--text-small);
  color: var(--color-ink);
  padding: 0;
}

.input:focus {
  outline: none;
}

.trigger {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-bark-light);
  padding: 0 var(--space-1);
  font-size: 14px;
  line-height: 1;
}

.popup {
  background: var(--color-parchment-light);
  border: 1px solid var(--color-bark-light);
  border-radius: 3px;
  box-shadow: var(--shadow-panel);
  z-index: var(--z-popover);
  max-height: 240px;
  overflow-y: auto;
  min-width: var(--anchor-width);
}

.list {
  padding: var(--space-1) 0;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-small);
  color: var(--color-ink);
}

.item[data-highlighted] {
  background: var(--color-parchment);
}

.itemBadge {
  display: inline-block;
  padding: 1px var(--space-1);
  border-radius: 4px;
  border: 1.5px solid var(--chip-color, var(--color-bark));
  background: var(--chip-bg, var(--color-parchment));
  color: var(--chip-color, var(--color-bark));
  font-family: var(--font-display);
  font-size: var(--text-badge);
  font-style: italic;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.itemName {
  flex: 1;
}

.itemIndicator {
  display: none;
  color: var(--color-bark);
  font-size: 12px;
}

.item[data-selected] .itemIndicator {
  display: inline;
}
```

- [ ] **Step 2: Create the component**

Create `src/ui/EventTypeSelect/EventTypeSelect.tsx`:

```tsx
import React, { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_COLORS } from "../../utils/conceptColors";
import styles from "./EventTypeSelect.module.css";

export interface EventTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const OPTIONS = Object.entries(EVENT_TYPES).map(([code, label]) => ({
  code,
  label,
  name: label.replace(/^[A-Z]+ - /, ""),
}));

export function EventTypeSelect({
  value,
  onValueChange,
}: EventTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = Combobox.useFilter();

  const selectedCodes = value ? value.split(",") : [];

  const filteredOptions = filterText
    ? OPTIONS.filter(
        ({ code, name }) =>
          filter.contains(code, filterText) ||
          filter.contains(name, filterText),
      )
    : OPTIONS;

  return (
    <Combobox.Root
      multiple
      value={selectedCodes}
      onValueChange={(codes) => onValueChange(codes.join(","))}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setFilterText("");
      }}
      onInputValueChange={(text) => setFilterText(text)}
      className={styles.root}
    >
      <Combobox.Label className={styles.label}>Event Type</Combobox.Label>
      <Combobox.InputGroup className={styles.inputGroup}>
        <Combobox.Chips className={styles.chips}>
          {selectedCodes.map((code) => {
            const colors = EVENT_TYPE_COLORS[code];
            return (
              <Combobox.Chip
                key={code}
                data-testid="chip"
                className={styles.chip}
                style={
                  colors
                    ? ({
                        "--chip-color": colors.color,
                        "--chip-bg": colors.bg,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <span className={styles.chipLabel}>
                  {code}
                  {open && (
                    <span className={styles.chipFullName}>
                      {" \u2013 "}
                      {EVENT_TYPES[code]?.replace(/^[A-Z]+ - /, "")}
                    </span>
                  )}
                </span>
                <Combobox.ChipRemove
                  className={styles.chipRemove}
                  aria-label={`Remove ${code}`}
                >
                  ×
                </Combobox.ChipRemove>
              </Combobox.Chip>
            );
          })}
        </Combobox.Chips>
        <Combobox.Input
          className={styles.input}
          placeholder={
            selectedCodes.length > 0 ? "Add type\u2026" : "Filter types\u2026"
          }
        />
        <Combobox.Trigger
          className={styles.trigger}
          aria-label="Toggle event type list"
        >
          ▾
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup className={styles.popup}>
            <Combobox.List className={styles.list}>
              {filteredOptions.map(({ code, name }) => {
                const colors = EVENT_TYPE_COLORS[code];
                return (
                  <Combobox.Item
                    key={code}
                    value={code}
                    className={styles.item}
                  >
                    <span
                      className={styles.itemBadge}
                      style={
                        colors
                          ? ({
                              "--chip-color": colors.color,
                              "--chip-bg": colors.bg,
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {code}
                    </span>
                    <span className={styles.itemName}>{name}</span>
                    <Combobox.ItemIndicator className={styles.itemIndicator}>
                      ✓
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                );
              })}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npx vitest run src/ui/EventTypeSelect/EventTypeSelect.test.tsx
```

Expected: PASS (all 10 tests). If any test fails due to Base UI rendering specifics (e.g. portal not found in jsdom), address each failure individually before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/ui/EventTypeSelect/
git commit -m "feat(ui): add EventTypeSelect combobox with colored chips"
```

---

### Task 4: Wire EventTypeSelect into SearchForm

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Update SearchForm.tsx**

In `src/components/SearchForm/SearchForm.tsx`, make these three changes:

**a) Replace the enums import** — remove `EVENT_TYPES` since it's no longer needed in this file:

```tsx
import { AGE_GROUPS, CATEGORY, EXP, REGISTRATION } from "../../utils/enums";
```

**b) Add EventTypeSelect import** after the existing ui imports:

```tsx
import { EventTypeSelect } from "../../ui/EventTypeSelect/EventTypeSelect";
```

**c) Add `eventType` to the watched values** — after line 91 (`const days = watch("days") ?? "";`):

```tsx
const eventType = watch("eventType") ?? "";
```

**d) Replace the Event Type label+select block** (the entire `<label>` wrapping the `<select>`) with:

```tsx
<EventTypeSelect
  value={eventType}
  onValueChange={(v) => setValue("eventType", v)}
/>
```

- [ ] **Step 2: Run the SearchForm test suite to find breakage**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: One test fails — "picks up new defaultValues when re-mounted with a new key" — because it uses `toHaveValue("BGM")` on the combobox input (which now holds filter text, not selected codes).

- [ ] **Step 3: Update the failing test in SearchForm.test.tsx**

Replace the test "picks up new defaultValues when re-mounted with a new key":

```tsx
test("picks up new defaultValues when re-mounted with a new key", () => {
  const { rerender } = render(
    <SearchForm key="a" defaultValues={{ eventType: "BGM" }} onSearch={noop} />,
  );
  expect(
    screen.getByRole("button", { name: "Remove BGM" }),
  ).toBeInTheDocument();

  rerender(
    <SearchForm key="b" defaultValues={{ eventType: "RPG" }} onSearch={noop} />,
  );

  expect(
    screen.getByRole("button", { name: "Remove RPG" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Remove BGM" }),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: PASS (all tests across all files)

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat(SearchForm): replace eventType select with EventTypeSelect combobox"
```
