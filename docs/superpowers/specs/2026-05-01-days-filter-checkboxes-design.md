# Days Filter: Checkboxes Instead of Press Buttons

## Summary

Replace the `ToggleTileGroup`/`ToggleTile` press-button UI in the DAYS section of `SearchForm` with native `<input type="checkbox">` + `<label>` pairs.

## Components Affected

- `src/components/SearchForm/SearchForm.tsx` — replace ToggleTile usage with checkboxes
- `src/components/SearchForm/SearchForm.module.css` — `.dayTiles` class stays as-is
- `src/components/SearchForm/SearchForm.test.tsx` — update queries to use checkbox role/label
- `src/ui/ToggleTile/` — entire directory can be deleted (only used in SearchForm)

## State

`days` remains a comma-separated string (e.g. `"wed,thu,fri,sat,sun"`). No change to `SearchFormValues`, URL params, or API integration.

## Checkbox Binding

Each `<input type="checkbox">` is:

- `checked`: `days.split(",").includes(key)` (or `false` when `days` is empty)
- `onChange`: toggles the key in/out of the comma-separated string via `setValue("days", ...)`
- `disabled`: passes through `daysDisabled` as-is

## Layout

Horizontal row of checkbox+label pairs using the existing `.dayTiles` CSS class (`display: flex; flex-wrap: wrap; gap: …`). Label text beside each checkbox.

## Accessibility

Native `<input type="checkbox">` within a `<label>` — no additional ARIA needed. The enclosing `<fieldset>` + `<legend>DAYS</legend>` already provides group context.

## Test Updates

`SearchForm.test.tsx` day filter tests update from querying by button/pressed state to:

- `getByRole("checkbox", { name: "Wed" })` etc.
- Assert `checked` attribute instead of `aria-pressed`

## Cleanup

Delete `src/ui/ToggleTile/` (`.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`) — `ToggleTile` has no other consumers.
