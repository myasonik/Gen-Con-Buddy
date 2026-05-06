# Game System Typeahead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text Game System input in the Advanced Filters drawer with a multi-select typeahead backed by the `GET /api/events/facets/gameSystem` endpoint, and extract the shared combobox wiring into a reusable `MultiCombobox` primitive.

**Architecture:** A new `MultiCombobox` primitive in `src/ui/` owns all Base UI Combobox wiring and state; `EventTypeSelect` is refactored to use it (behaviour unchanged); a new `GameSystemSelect` fetches facets via `useQuery` on first drawer open and passes them to `MultiCombobox`. `SearchForm` swaps the plain text input for `GameSystemSelect`.

**Tech Stack:** `@base-ui/react/combobox`, `@tanstack/react-query`, `msw` (tests), `vitest` + `@testing-library/react`

**Working directory:** `/home/myasonik/Workspace/Gen-Con-Buddy-game-system-typeahead`
**Branch:** `feat/game-system-typeahead`
**Run tests:** `npm test`
**Run one file:** `npx vitest run --reporter verbose src/path/to/file.test.tsx`
**Typecheck:** `npm run typecheck`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/utils/types.ts` | Modify | Add `GameSystemFacet`, `GameSystemFacetsResponse` |
| `src/utils/api.ts` | Modify | Add `fetchGameSystemFacets()` |
| `src/test/msw/handlers.ts` | Modify | Add default handler for `/api/events/facets/gameSystem` |
| `src/ui/MultiCombobox/MultiCombobox.tsx` | Create | Shared multi-select combobox primitive |
| `src/ui/MultiCombobox/MultiCombobox.module.css` | Create | Shared styles (moved from EventTypeSelect) |
| `src/ui/MultiCombobox/MultiCombobox.test.tsx` | Create | Unit tests for the primitive |
| `src/components/EventTypeSelect/EventTypeSelect.tsx` | Modify | Thin wrapper over `MultiCombobox` |
| `src/components/EventTypeSelect/EventTypeSelect.module.css` | Modify | Keep only `.itemBadge` and `.itemName` (EventTypeSelect-specific) |
| `src/components/EventTypeSelect/EventTypeSelect.test.tsx` | Modify | Replace `data-testid` chip queries with `data-tone` queries |
| `src/components/GameSystemSelect/GameSystemSelect.tsx` | Create | Fetches facets, renders `MultiCombobox` |
| `src/components/GameSystemSelect/GameSystemSelect.module.css` | Create | `.optionName`, `.optionCount` styles |
| `src/components/GameSystemSelect/GameSystemSelect.test.tsx` | Create | MSW-backed tests |
| `src/components/SearchForm/SearchForm.tsx` | Modify | Replace `<Field label="Game System"><input /></Field>` with `<GameSystemSelect />` |
| `src/components/SearchForm/SearchForm.test.tsx` | Modify | Add `QueryClientProvider` wrapper + new Game System assertion |

---

## Task 1: Add types, API function, and MSW default handler

**Files:**
- Modify: `src/utils/types.ts`
- Modify: `src/utils/api.ts`
- Modify: `src/test/msw/handlers.ts`

- [ ] **Step 1: Add types to `src/utils/types.ts`**

Append at the end of the file:

```ts
export interface GameSystemFacet {
  value: string;
  count: number;
}

export interface GameSystemFacetsResponse {
  values: GameSystemFacet[];
}
```

- [ ] **Step 2: Add `fetchGameSystemFacets` to `src/utils/api.ts`**

Add this import to the existing import from `./types`:
```ts
import type {
  EventSearchResponse,
  SearchParams,
  ListChangelogsResponse,
  FetchChangelogResponse,
  ChangelogEntry,
  ChangelogSummary,
  GameSystemFacet,
  GameSystemFacetsResponse,
} from "./types";
```

Append the function at the end of the file:
```ts
export async function fetchGameSystemFacets(): Promise<GameSystemFacet[]> {
  const url = new URL("/api/events/facets/gameSystem", window.location.origin);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as GameSystemFacetsResponse;
  return data.values;
}
```

- [ ] **Step 3: Add default MSW handler in `src/test/msw/handlers.ts`**

Add to the existing import from `../../utils/types`:
```ts
import type {
  Event,
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  GameSystemFacetsResponse,
} from "../../utils/types";
```

Add to the `handlers` array:
```ts
export const handlers = [
  buildEventsHandler(DEFAULT_POOL),
  http.get("/api/changelog/list", () => { /* existing */ }),
  http.get("/api/changelog/fetch", () => { /* existing */ }),
  http.get("/api/events/facets/gameSystem", () => {
    const response: GameSystemFacetsResponse = {
      values: [
        { value: "Dungeons & Dragons 5E", count: 142 },
        { value: "Pathfinder 2E", count: 87 },
        { value: "Call of Cthulhu", count: 45 },
      ],
    };
    return HttpResponse.json(response);
  }),
];
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/types.ts src/utils/api.ts src/test/msw/handlers.ts
git commit -m "feat(game-system): add facet type, API function, and MSW default handler"
```

---

## Task 2: Write failing `MultiCombobox` tests

**Files:**
- Create: `src/ui/MultiCombobox/MultiCombobox.test.tsx`

- [ ] **Step 1: Create the test file**

Create `src/ui/MultiCombobox/MultiCombobox.test.tsx`:

```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiCombobox } from "./MultiCombobox";

const OPTIONS = [
  { value: "alpha", label: "Alpha Option" },
  { value: "beta", label: "Beta Option" },
  { value: "gamma", label: "Gamma Option" },
];

test("renders label and combobox input", () => {
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);
  expect(screen.getByRole("combobox", { name: "Test Field" })).toBeInTheDocument();
});

test("shows no chips when value is empty", () => {
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);
  expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
});

test("shows chips for selected values using option labels", () => {
  render(
    <MultiCombobox label="Test Field" value="alpha,beta" onValueChange={() => {}} options={OPTIONS} />,
  );
  expect(screen.getByRole("button", { name: "Remove Alpha Option" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove Beta Option" })).toBeInTheDocument();
});

test("chip remove button calls onValueChange without that value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Alpha Option" }));

  expect(handleChange).toHaveBeenCalledWith("beta");
});

test("backspace on empty input removes the last chip", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.keyboard("{Backspace}");

  expect(handleChange).toHaveBeenCalledWith("alpha");
});

test("type-to-filter narrows options", async () => {
  const user = userEvent.setup();
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.type(screen.getByRole("combobox", { name: "Test Field" }), "alpha");

  expect(screen.getByRole("option", { name: "Alpha Option" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Beta Option" })).not.toBeInTheDocument();
});

test("selecting an option calls onValueChange with that value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox label="Test Field" value="" onValueChange={handleChange} options={OPTIONS} />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.click(screen.getByRole("option", { name: "Beta Option" }));

  expect(handleChange).toHaveBeenCalledWith("beta");
});

test("selecting a second option appends to the value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.click(screen.getByRole("option", { name: "Beta Option" }));

  expect(handleChange).toHaveBeenCalledWith("alpha,beta");
});

test("selecting an already-selected option removes it", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha,beta"
      onValueChange={handleChange}
      options={OPTIONS}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.click(screen.getByRole("option", { name: "Beta Option" }));

  expect(handleChange).toHaveBeenCalledWith("alpha");
});

test("filter text is cleared when dropdown closes", async () => {
  const user = userEvent.setup();
  render(<MultiCombobox label="Test Field" value="" onValueChange={() => {}} options={OPTIONS} />);

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));
  await user.type(screen.getByRole("combobox", { name: "Test Field" }), "alpha");
  expect(screen.queryByRole("option", { name: "Beta Option" })).not.toBeInTheDocument();

  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("combobox", { name: "Test Field" }));

  expect(screen.getByRole("option", { name: "Beta Option" })).toBeInTheDocument();
});

test("custom renderChipContent is called with option and isOpen", () => {
  const renderChipContent = vi.fn(() => <span data-testid="custom-chip">custom</span>);
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={() => {}}
      options={OPTIONS}
      renderChipContent={renderChipContent}
    />,
  );

  expect(screen.getByTestId("custom-chip")).toBeInTheDocument();
  expect(renderChipContent).toHaveBeenCalledWith(
    expect.objectContaining({ value: "alpha", label: "Alpha Option" }),
    expect.any(Boolean),
  );
});

test("custom renderOptionContent is rendered inside list items", async () => {
  const user = userEvent.setup();
  const renderOptionContent = vi.fn((opt: { value: string; label: string }) => (
    <span data-testid={`opt-${opt.value}`}>{opt.label}</span>
  ));
  render(
    <MultiCombobox
      label="Test Field"
      value=""
      onValueChange={() => {}}
      options={OPTIONS}
      renderOptionContent={renderOptionContent}
    />,
  );

  await user.click(screen.getByRole("combobox", { name: "Test Field" }));

  expect(screen.getByTestId("opt-alpha")).toBeInTheDocument();
  expect(screen.getByTestId("opt-beta")).toBeInTheDocument();
});

test("isLoading disables the combobox input", () => {
  render(
    <MultiCombobox
      label="Test Field"
      value=""
      onValueChange={() => {}}
      options={[]}
      isLoading
    />,
  );

  expect(screen.getByRole("combobox", { name: "Test Field" })).toBeDisabled();
});

test("chips render raw value as label when option is not in options list", () => {
  render(
    <MultiCombobox
      label="Test Field"
      value="not-loaded-yet"
      onValueChange={() => {}}
      options={[]}
    />,
  );

  expect(screen.getByRole("button", { name: "Remove not-loaded-yet" })).toBeInTheDocument();
});

test("custom renderChipIcon is rendered via the chip icon slot", () => {
  const renderChipIcon = vi.fn(() => <svg data-testid="chip-icon" />);
  render(
    <MultiCombobox
      label="Test Field"
      value="alpha"
      onValueChange={() => {}}
      options={OPTIONS}
      renderChipIcon={renderChipIcon}
    />,
  );

  expect(screen.getByTestId("chip-icon")).toBeInTheDocument();
  expect(renderChipIcon).toHaveBeenCalledWith(
    expect.objectContaining({ value: "alpha" }),
  );
});

test("two mounted MultiCombobox instances have distinct input ids", () => {
  render(
    <>
      <MultiCombobox label="First" value="" onValueChange={() => {}} options={OPTIONS} />
      <MultiCombobox label="Second" value="" onValueChange={() => {}} options={OPTIONS} />
    </>,
  );
  const inputs = screen.getAllByRole("combobox");
  expect(inputs[0].id).not.toBe("");
  expect(inputs[1].id).not.toBe("");
  expect(inputs[0].id).not.toBe(inputs[1].id);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run --reporter verbose src/ui/MultiCombobox/MultiCombobox.test.tsx
```

Expected: all tests fail with "Cannot find module './MultiCombobox'" or similar.

- [ ] **Step 3: Commit the test file**

```bash
git add src/ui/MultiCombobox/MultiCombobox.test.tsx
git commit -m "test(multi-combobox): write failing tests for MultiCombobox primitive"
```

---

## Task 3: Implement `MultiCombobox`

**Files:**
- Create: `src/ui/MultiCombobox/MultiCombobox.module.css`
- Create: `src/ui/MultiCombobox/MultiCombobox.tsx`

- [ ] **Step 1: Create `src/ui/MultiCombobox/MultiCombobox.module.css`**

This is the shared structure CSS, identical to the current `EventTypeSelect.module.css`:

```css
.root {
  position: relative;
  margin-bottom: 0;
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  font-family: var(--font-slab);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.inputGroup {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  cursor: text;
  min-height: 2rem;
  border: var(--border-width) solid var(--color-ink-border);
  border-radius: var(--radius-subtle);
  overflow: hidden;
  min-width: 0;
  background: var(--color-surface-page);
  transition: border-color var(--motion-hover);
}

.inputGroupInner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.inputGroup:focus-within {
  outline: var(--focus-ring);
  outline-color: var(--color-accent);
  outline-offset: var(--focus-ring-offset);
}

.input {
  flex: 1;
  min-width: 0;
  width: 0;
  border: none;
  background: none;
  padding: 0;
  font-size: var(--text-base);
}

.input:focus {
  outline: none;
}

.trigger {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0 var(--space-1);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  color: var(--color-ink-faint);
}

.list {
  composes: surface from "../../styles/popup.module.css";
  position: absolute;
  z-index: var(--z-popover);
  padding: var(--space-1) 0;
  max-height: 15rem;
  overflow-y: scroll;
  width: 100%;
  border-radius: var(--radius-card);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-size: var(--text-base);
  transition: background-color var(--motion-hover);
}

.item:hover {
  background: var(--color-surface-hover);
}

.itemName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itemIndicator {
  display: none;
  color: var(--color-accent);
}

.item[data-selected] .itemIndicator {
  display: inline;
}

@media (width <= 60rem) {
  .inputGroup {
    min-height: 2.75rem;
  }
}
```

- [ ] **Step 2: Create `src/ui/MultiCombobox/MultiCombobox.tsx`**

```tsx
import React, { useState, useId, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { Chip } from "../Chip/Chip";
import styles from "./MultiCombobox.module.css";

export interface MultiComboboxOption {
  value: string;
  label: string;
}

export interface MultiComboboxProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: MultiComboboxOption[];
  filterOption?: (option: MultiComboboxOption, filterText: string) => boolean;
  renderChipContent?: (option: MultiComboboxOption, isOpen: boolean) => React.ReactNode;
  renderChipIcon?: (option: MultiComboboxOption) => React.ReactNode;
  renderOptionContent?: (option: MultiComboboxOption) => React.ReactNode;
  isLoading?: boolean;
}

export function MultiCombobox({
  label,
  value,
  onValueChange,
  options,
  filterOption,
  renderChipContent,
  renderChipIcon,
  renderOptionContent,
  isLoading = false,
}: MultiComboboxProps): React.JSX.Element {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = Combobox.useFilter();

  const selectedValues = value ? value.split(",") : [];

  const defaultFilter = (option: MultiComboboxOption, text: string): boolean =>
    filter.contains(option.value, text) || filter.contains(option.label, text);

  const filteredOptions = filterText
    ? options.filter((opt) => (filterOption ?? defaultFilter)(opt, filterText))
    : options;

  function getOption(val: string): MultiComboboxOption {
    return options.find((o) => o.value === val) ?? { value: val, label: val };
  }

  function removeValue(val: string): void {
    onValueChange(selectedValues.filter((v) => v !== val).join(","));
  }

  return (
    <div
      className={styles.root}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setFilterText("");
        }
      }}
    >
      <Combobox.Root
        multiple
        open={open}
        value={selectedValues}
        onValueChange={(values) => onValueChange(values.join(","))}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setFilterText("");
        }}
        onInputValueChange={(text) => setFilterText(text)}
      >
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <Combobox.InputGroup
          className={styles.inputGroup}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            if (!open) setOpen(true);
            inputRef.current?.focus();
          }}
        >
          <div className={styles.inputGroupInner}>
            {selectedValues.map((val) => {
              const option = getOption(val);
              return (
                <Chip
                  key={val}
                  tone="accent"
                  icon={renderChipIcon?.(option)}
                  onRemove={() => removeValue(val)}
                  removeLabel={option.label}
                >
                  {renderChipContent ? renderChipContent(option, open) : option.label}
                </Chip>
              );
            })}
            <Combobox.Input
              ref={inputRef}
              id={inputId}
              className={styles.input}
              disabled={isLoading}
              placeholder={
                isLoading
                  ? "Loading…"
                  : selectedValues.length > 0
                    ? "Add…"
                    : `Filter ${label.toLowerCase()}…`
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  e.currentTarget.value === "" &&
                  selectedValues.length > 0
                ) {
                  onValueChange(selectedValues.slice(0, -1).join(","));
                }
              }}
            />
          </div>
          <Combobox.Trigger className={styles.trigger} aria-label={`Toggle ${label} list`}>
            <ChevronDown size={14} aria-hidden="true" />
          </Combobox.Trigger>
        </Combobox.InputGroup>
        {open && (
          <Combobox.List className={styles.list}>
            {filteredOptions.map((option) => (
              <Combobox.Item
                key={option.value}
                value={option.value}
                aria-label={option.label}
                className={styles.item}
              >
                {renderOptionContent ? (
                  renderOptionContent(option)
                ) : (
                  <span className={styles.itemName}>{option.label}</span>
                )}
                <Combobox.ItemIndicator className={styles.itemIndicator}>
                  <Check size={12} aria-hidden="true" />
                </Combobox.ItemIndicator>
              </Combobox.Item>
            ))}
          </Combobox.List>
        )}
      </Combobox.Root>
    </div>
  );
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npx vitest run --reporter verbose src/ui/MultiCombobox/MultiCombobox.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/MultiCombobox/MultiCombobox.tsx src/ui/MultiCombobox/MultiCombobox.module.css
git commit -m "feat(ui): add MultiCombobox shared primitive"
```

---

## Task 4: Refactor `EventTypeSelect` to use `MultiCombobox`

**Files:**
- Modify: `src/components/EventTypeSelect/EventTypeSelect.tsx`
- Modify: `src/components/EventTypeSelect/EventTypeSelect.module.css`
- Modify: `src/components/EventTypeSelect/EventTypeSelect.test.tsx`

- [ ] **Step 1: Update `EventTypeSelect.test.tsx` — replace `data-testid` chip queries with `data-tone`**

There are three tests that query chips via `data-testid`. Replace them:

```tsx
// Test: "shows short code chips for selected values when closed"
// BEFORE:
test("shows short code chips for selected values when closed", () => {
  render(<EventTypeSelect value="RPG,BGM" onValueChange={() => {}} />);
  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const bgmRemove = screen.getByRole("button", { name: "Remove BGM" });
  expect(rpgRemove.closest("[data-testid=chip]")).toHaveTextContent("RPG");
  expect(rpgRemove.closest("[data-testid=chip]")).not.toHaveTextContent("Roleplaying Game");
  expect(bgmRemove.closest("[data-testid=chip]")).toHaveTextContent("BGM");
  expect(bgmRemove.closest("[data-testid=chip]")).not.toHaveTextContent("Board Game");
});

// AFTER:
test("shows short code chips for selected values when closed", () => {
  render(<EventTypeSelect value="RPG,BGM" onValueChange={() => {}} />);
  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const bgmRemove = screen.getByRole("button", { name: "Remove BGM" });
  expect(rpgRemove.closest("[data-tone]")).toHaveTextContent("RPG");
  expect(rpgRemove.closest("[data-tone]")).not.toHaveTextContent("Roleplaying Game");
  expect(bgmRemove.closest("[data-tone]")).toHaveTextContent("BGM");
  expect(bgmRemove.closest("[data-tone]")).not.toHaveTextContent("Board Game");
});

// Test: "chips expand to show full name when dropdown is open"
// BEFORE:
test("chips expand to show full name when dropdown is open", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);
  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const chip = rpgRemove.closest("[data-testid=chip]");
  expect(chip).toHaveTextContent("RPG");
  expect(chip).toHaveTextContent("Roleplaying Game");
});

// AFTER:
test("chips expand to show full name when dropdown is open", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);
  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const chip = rpgRemove.closest("[data-tone]");
  expect(chip).toHaveTextContent("RPG");
  expect(chip).toHaveTextContent("Roleplaying Game");
});

// Test: "selected chip renders an icon alongside the code"
// BEFORE:
test("selected chip renders an icon alongside the code", () => {
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);
  const chip = screen.getByTestId("chip");
  expect(chip.querySelector("svg")).not.toBeNull();
});

// AFTER:
test("selected chip renders an icon alongside the code", () => {
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);
  const removeButton = screen.getByRole("button", { name: "Remove RPG" });
  const chip = removeButton.closest("[data-tone]");
  expect(chip?.querySelector("svg")).not.toBeNull();
});

// Test: "pills expand to show full name when Tab moves focus into the input"
// BEFORE:
test("pills expand to show full name when Tab moves focus into the input", async () => {
  ...
  const chip = screen.getByTestId("chip");
  expect(chip).toHaveTextContent("Roleplaying Game");
});

// AFTER:
test("pills expand to show full name when Tab moves focus into the input", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">Previous element</button>
      <EventTypeSelect value="RPG" onValueChange={() => {}} />
    </>,
  );
  await user.click(screen.getByRole("button", { name: "Previous element" }));
  await user.tab(); // → Remove RPG chip button
  await user.tab(); // → input

  const removeButton = screen.getByRole("button", { name: "Remove RPG" });
  const chip = removeButton.closest("[data-tone]");
  expect(chip).toHaveTextContent("Roleplaying Game");
});

// Test: "pills expand to show full name when Tab moves focus onto a chip button"
// BEFORE:
test("pills expand to show full name when Tab moves focus onto a chip button", async () => {
  ...
  const chip = screen.getByTestId("chip");
  expect(chip).toHaveTextContent("Roleplaying Game");
});

// AFTER:
test("pills expand to show full name when Tab moves focus onto a chip button", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">Previous element</button>
      <EventTypeSelect value="RPG" onValueChange={() => {}} />
    </>,
  );
  await user.click(screen.getByRole("button", { name: "Previous element" }));
  await user.tab(); // → Remove RPG chip button (first tab stop in the component)

  const removeButton = screen.getByRole("button", { name: "Remove RPG" });
  const chip = removeButton.closest("[data-tone]");
  expect(chip).toHaveTextContent("Roleplaying Game");
});
```

- [ ] **Step 2: Run existing EventTypeSelect tests to confirm the test file itself is valid (will fail on import until implementation is done)**

```bash
npx vitest run --reporter verbose src/components/EventTypeSelect/EventTypeSelect.test.tsx
```

Expected: tests pass (the component is still the old implementation; we're just checking test file syntax is valid).

- [ ] **Step 3: Rewrite `EventTypeSelect.tsx` to use `MultiCombobox`**

Replace the entire file contents of `src/components/EventTypeSelect/EventTypeSelect.tsx`:

```tsx
import React from "react";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { MultiCombobox, type MultiComboboxOption } from "../../ui/MultiCombobox/MultiCombobox";
import styles from "./EventTypeSelect.module.css";

export interface EventTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const OPTIONS: MultiComboboxOption[] = Object.entries(EVENT_TYPES).map(([code, label]) => ({
  value: code,
  label: label.replace(/^[A-Z]+ - /, ""),
}));

export function EventTypeSelect({ value, onValueChange }: EventTypeSelectProps): React.JSX.Element {
  return (
    <MultiCombobox
      label="Event Type"
      value={value}
      onValueChange={onValueChange}
      options={OPTIONS}
      renderChipIcon={(option) => {
        const Icon = EVENT_TYPE_ICONS[option.value];
        return Icon ? <Icon size={12} aria-hidden="true" /> : undefined;
      }}
      renderChipContent={(option, isOpen) => (
        <>
          {option.value}
          {isOpen && (
            <span>
              {" – "}
              {option.label}
            </span>
          )}
        </>
      )}
      renderOptionContent={(option) => {
        const Icon = EVENT_TYPE_ICONS[option.value];
        return (
          <>
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span aria-hidden className={styles.itemBadge}>
              {option.value}
            </span>
            <span className={styles.itemName}>{option.label}</span>
          </>
        );
      }}
    />
  );
}
```

- [ ] **Step 4: Update `EventTypeSelect.module.css` — keep only EventTypeSelect-specific styles**

Replace the entire file with only the styles used by EventTypeSelect's custom renderers:

```css
.itemBadge {
  display: inline-block;
  padding: 0.0625rem var(--space-1);
  white-space: nowrap;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
}

.itemName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 5: Run EventTypeSelect tests — all must pass**

```bash
npx vitest run --reporter verbose src/components/EventTypeSelect/EventTypeSelect.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/EventTypeSelect/EventTypeSelect.tsx \
        src/components/EventTypeSelect/EventTypeSelect.module.css \
        src/components/EventTypeSelect/EventTypeSelect.test.tsx
git commit -m "refactor(event-type-select): use MultiCombobox primitive"
```

---

## Task 5: Write failing `GameSystemSelect` tests

**Files:**
- Create: `src/components/GameSystemSelect/GameSystemSelect.test.tsx`

- [ ] **Step 1: Create the test file**

Create `src/components/GameSystemSelect/GameSystemSelect.test.tsx`:

```tsx
import { expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import type { GameSystemFacetsResponse } from "../../utils/types";
import { GameSystemSelect } from "./GameSystemSelect";

function renderGameSystemSelect(
  value = "",
  onValueChange: (v: string) => void = vi.fn(),
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

  expect(
    screen.getByRole("button", { name: "Remove Dungeons & Dragons 5E" }),
  ).toBeInTheDocument();
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run --reporter verbose src/components/GameSystemSelect/GameSystemSelect.test.tsx
```

Expected: all tests fail with "Cannot find module './GameSystemSelect'".

- [ ] **Step 3: Commit the test file**

```bash
git add src/components/GameSystemSelect/GameSystemSelect.test.tsx
git commit -m "test(game-system-select): write failing tests"
```

---

## Task 6: Implement `GameSystemSelect`

**Files:**
- Create: `src/components/GameSystemSelect/GameSystemSelect.module.css`
- Create: `src/components/GameSystemSelect/GameSystemSelect.tsx`

- [ ] **Step 1: Create `src/components/GameSystemSelect/GameSystemSelect.module.css`**

```css
.optionName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.optionCount {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create `src/components/GameSystemSelect/GameSystemSelect.tsx`**

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "../../ui/MultiCombobox/MultiCombobox";
import { fetchGameSystemFacets } from "../../utils/api";
import styles from "./GameSystemSelect.module.css";

export interface GameSystemSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function GameSystemSelect({
  value,
  onValueChange,
}: GameSystemSelectProps): React.JSX.Element | null {
  const { data: facets, isLoading, isError } = useQuery({
    queryKey: ["gameSystemFacets"],
    queryFn: fetchGameSystemFacets,
    staleTime: Infinity,
  });

  if (isError) return null;

  const options = (facets ?? []).map((f) => ({ value: f.value, label: f.value }));

  return (
    <MultiCombobox
      label="Game System"
      value={value}
      onValueChange={onValueChange}
      options={options}
      isLoading={isLoading}
      renderOptionContent={(option) => {
        const facet = facets?.find((f) => f.value === option.value);
        return (
          <>
            <span className={styles.optionName}>{option.label}</span>
            {facet !== undefined && (
              <span className={styles.optionCount}>{facet.count}</span>
            )}
          </>
        );
      }}
    />
  );
}
```

- [ ] **Step 3: Run GameSystemSelect tests — all must pass**

```bash
npx vitest run --reporter verbose src/components/GameSystemSelect/GameSystemSelect.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/GameSystemSelect/GameSystemSelect.tsx \
        src/components/GameSystemSelect/GameSystemSelect.module.css
git commit -m "feat(game-system-select): implement GameSystemSelect with lazy facet fetch"
```

---

## Task 7: Wire `GameSystemSelect` into `SearchForm`

**Files:**
- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Write the new failing SearchForm test**

In `SearchForm.test.tsx`, update the import from `@testing-library/react` to include `waitFor`:

```tsx
import { render, screen, within, waitFor } from "@testing-library/react";
```

Add `QueryClientProvider` import:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
```

Add a `renderSearchForm` helper after the `noop` declaration:

```tsx
function renderSearchForm(
  values: SearchFormValues = {},
  onSearch: (v: SearchFormValues) => void = noop,
): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SearchForm values={values} onSearch={onSearch} />
    </QueryClientProvider>,
  );
}
```

Replace every `render(<SearchForm` call with `renderSearchForm(`. For example:

```tsx
// BEFORE:
render(<SearchForm values={{}} onSearch={noop} />);
// AFTER:
renderSearchForm();

// BEFORE:
render(<SearchForm values={{ title: "Dungeon Crawl" }} onSearch={noop} />);
// AFTER:
renderSearchForm({ title: "Dungeon Crawl" });

// BEFORE:
const handleSearch = vi.fn<(values: SearchFormValues) => void>();
render(<SearchForm values={{}} onSearch={handleSearch} />);
// AFTER:
const handleSearch = vi.fn<(values: SearchFormValues) => void>();
renderSearchForm({}, handleSearch);
```

The one exception is the `"picks up new values when values prop changes"` test which uses `rerender`. Replace it in full:

```tsx
test("picks up new values when values prop changes", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ eventType }: { eventType: string }): React.JSX.Element => (
    <QueryClientProvider client={client}>
      <SearchForm values={{ eventType }} onSearch={noop} />
    </QueryClientProvider>
  );
  const { rerender } = render(<Wrapper eventType="BGM" />);
  expect(screen.getByRole("button", { name: "Remove BGM" })).toBeInTheDocument();

  rerender(<Wrapper eventType="RPG" />);

  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove BGM" })).not.toBeInTheDocument();
});
```

Add `React` to the imports if not already present (`import React from "react";`).

Then add the new test at the end of the file:

```tsx
test("Game System field renders as a combobox (not a plain text input) when drawer is open", async () => {
  const user = userEvent.setup();
  renderSearchForm();

  await user.click(screen.getByRole("button", { name: "Filters" }));

  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Game System" })).toBeInTheDocument(),
  );
  expect(screen.queryByRole("textbox", { name: "Game System" })).not.toBeInTheDocument();
});
```

Add `waitFor` to the imports from `@testing-library/react`.

- [ ] **Step 2: Run SearchForm tests — new test fails, existing pass**

```bash
npx vitest run --reporter verbose src/components/SearchForm/SearchForm.test.tsx
```

Expected: all existing tests pass; the new "Game System field renders as a combobox" test fails because the field is still a plain input.

- [ ] **Step 3: Update `SearchForm.tsx` — replace the plain Game System input**

Add the import near the top of `SearchForm.tsx` (with other component imports):

```tsx
import { GameSystemSelect } from "../GameSystemSelect/GameSystemSelect";
```

In the Details fieldset, find and replace:

```tsx
// REMOVE this block:
<Field label="Game System">
  <input type="text" className={styles.input} {...register("gameSystem")} />
</Field>

// REPLACE WITH:
<GameSystemSelect
  value={watch("gameSystem") ?? ""}
  onValueChange={(v) => setValue("gameSystem", v)}
/>
```

- [ ] **Step 4: Run SearchForm tests — all must pass**

```bash
npx vitest run --reporter verbose src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests pass including the new Game System combobox test.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx \
        src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat(search-form): replace Game System text input with GameSystemSelect typeahead"
```

---

## Done

All tasks complete. The feature is fully implemented:

- `MultiCombobox` primitive in `src/ui/` owns all Base UI Combobox boilerplate
- `EventTypeSelect` refactored to use it (behaviour unchanged)
- `GameSystemSelect` fetches facets lazily on first drawer open, caches for the session
- `SearchForm` uses `GameSystemSelect` in the Advanced Filters drawer
- Full test coverage at every layer
