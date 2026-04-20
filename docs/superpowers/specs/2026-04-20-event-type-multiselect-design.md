# Event Type Multi-Select Design

**Date:** 2026-04-20

## Overview

Replace the single `<select>` dropdown for Event Type in the Search form with a typeahead multi-select combobox. Each option shows its short code and full name; selections are displayed as colored chips. Colors come from the existing `EVENT_TYPE_COLORS` map.

## Component Architecture

New component: `src/ui/EventTypeSelect/EventTypeSelect.tsx`

- Built on `@base-ui/react/combobox`
- Manages open/closed state and filter string internally
- Public API: `value: string` (comma-separated codes, e.g. `"RPG,BGM"`) and `onValueChange: (value: string) => void`
- Styled via `EventTypeSelect.module.css`
- Lives in `src/ui/` as a self-contained interactive primitive with its own tests

### Visual behavior

- **Closed:** selected items render as compact colored chips showing only the short code (e.g. `RPG`, `BGM`). Placeholder text reads "Add type…" when at least one is selected, "Filter types…" when none.
- **Open:** chips expand to show code + full name (e.g. `RPG – Role Playing Game`). A text input allows filtering. Dropdown lists all 19 types with a colored code badge and full name per row. Already-selected items show a checkmark.
- **Filtering:** matches on both code (e.g. "RPG") and name (e.g. "role"), case-insensitive.
- **Colors:** chip and badge colors sourced from `EVENT_TYPE_COLORS` keyed by short code.

## Data Flow

`SearchFormValues.eventType` remains `string` — comma-separated codes at rest. No type change; mirrors the `days` field pattern.

`SearchForm` wires `EventTypeSelect` the same way it wires `ToggleTileGroup` for days:

```tsx
<EventTypeSelect
  value={eventType ?? ""}
  onValueChange={(v) => setValue("eventType", v)}
/>
```

In `api.ts`, the existing eventType serialization is updated to handle multiple values: split the comma-separated codes, map each to its full label via `EVENT_TYPES[code]`, rejoin with commas, and set as a single `eventType` query param.

> **Note:** Full multi-type filtering requires a corresponding backend change (switching `NewKeywordSingle` → `NewKeyword` for the EventType field in `search.go`). That work is tracked separately. The frontend serialization is already correct for when that change lands.

## Testing

### `EventTypeSelect.test.tsx`

- Selecting an option appends its code to the value string
- Selecting an already-selected option removes it
- Filter text narrows options by code
- Filter text narrows options by name
- Chips show short codes when closed
- Chips show full names when open
- Removing a chip via × deselects that option

### `SearchForm.test.tsx`

- Multi-select value flows through to `onSearch` as a comma-separated string

### `api.ts` tests

- Multiple codes serialize to comma-separated full labels in the URL
- Single code continues to serialize correctly

## Files Changed

| File                                                | Change                                         |
| --------------------------------------------------- | ---------------------------------------------- |
| `src/ui/EventTypeSelect/EventTypeSelect.tsx`        | New component                                  |
| `src/ui/EventTypeSelect/EventTypeSelect.module.css` | New styles                                     |
| `src/ui/EventTypeSelect/EventTypeSelect.test.tsx`   | New tests                                      |
| `src/components/SearchForm/SearchForm.tsx`          | Replace `<select>` with `EventTypeSelect`      |
| `src/utils/api.ts`                                  | Update eventType serialization for multi-value |
