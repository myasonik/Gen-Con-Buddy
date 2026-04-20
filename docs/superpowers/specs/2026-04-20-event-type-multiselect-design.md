# Event Type Multi-Select Design

**Date:** 2026-04-20

## Summary

Replace the single-select `<select>` for Event Type in the Search form with a typeahead multi-select combobox. Each option displays a colored badge (short code) alongside the full name. Selected items appear as compact short-code chips when the dropdown is closed, and expand to show full names when open.

## Component Architecture

New `src/ui/EventTypeSelect/EventTypeSelect.tsx` built on `@base-ui/react/combobox`.

- Owns open/closed state and filter string internally
- Public API: `value: string` (comma-separated codes, e.g. `"RPG,BGM"`) + `onValueChange: (value: string) => void`
- Accompanied by `EventTypeSelect.module.css` and `EventTypeSelect.test.tsx`
- Lives in `src/ui/` — it's a self-contained interactive primitive

## UX Behavior

- **Closed state:** selected items render as compact colored chips showing short code only (e.g. `RPG ×`)
- **Open state:** chips expand to show full name (e.g. `RPG – Role Playing Game ×`); a text input filters the option list
- **Filter:** matches on both short code and full name (e.g. "RPG" and "role" both surface Role Playing Game)
- **Option list:** each row shows a colored badge (short code) + full name; selected options are checkmarked
- **Colors:** sourced from `EVENT_TYPE_COLORS` in `src/utils/conceptColors.ts`

## Data Flow

`SearchFormValues.eventType` stays `string` — comma-separated codes at rest (e.g. `"RPG,BGM,HMN"`). No type change; mirrors the `days` field pattern exactly.

`SearchForm` wires `EventTypeSelect` the same way it wires `ToggleTileGroup` for days:

```tsx
<EventTypeSelect
  value={eventType}
  onValueChange={(v) => setValue("eventType", v)}
/>
```

In `api.ts`, the eventType serialization is updated: split comma-separated codes, map each to its full label via `EVENT_TYPES[code]`, rejoin with commas, and send as a single `eventType` query param.

## Backend Change (Gen-Con-Buddy-API)

In `internal/event/search.go`, change the EventType case from `NewKeywordSingle` to `NewKeyword` so it accepts comma-separated full labels and generates an Elasticsearch `terms` query instead of `term`.

## Testing

- `EventTypeSelect.test.tsx`: selecting adds a code, re-selecting removes it, filter narrows by code and name, chips show short codes closed / full names open
- `SearchForm.test.tsx`: multi-select value flows through to `onSearch` as comma-separated string
- `api.ts` tests: multiple codes serialize correctly to comma-separated full labels in the URL
