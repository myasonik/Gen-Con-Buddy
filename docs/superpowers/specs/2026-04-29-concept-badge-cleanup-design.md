# DS-16: ConceptBadge Cleanup

## Problem

`ConceptBadge` in `Badge.tsx` was built to render per-concept colors via CSS custom properties `--concept-color` and `--concept-bg`, backed by a `conceptColors.ts` utility. The wiring was never completed: the CSS vars are never set, so every badge renders with hardcoded fallbacks (`#666`/`#fff`). The `concept` prop is declared but never read. `conceptColors.ts` is only imported by its own test file. `Badge.test.tsx` pins the broken state by asserting the vars are empty strings.

## Decision

Delete `ConceptBadge` entirely and replace its three call sites in `columns.tsx` with `<Badge variant="outline">`. Delete the dead `conceptColors.ts` utility and its test. Remove `.conceptBadge` from the CSS. Strip the broken-state tests from `Badge.test.tsx`.

`outline` is the right variant for concept badges: they are supplemental metadata labels (event type, day, experience level), not primary content.

## Changes

### Delete

- `src/utils/conceptColors.ts`
- `src/utils/conceptColors.test.ts`

### `src/ui/Badge/Badge.tsx`

- Remove `ConceptBadge` function
- Remove `ConceptBadgeProps` interface and its export

### `src/ui/Badge/Badge.module.css`

- Delete the `.conceptBadge` block

### `src/ui/EventTable/columns.tsx`

Three call sites, each becomes `<Badge variant="outline">`:

```tsx
// eventType column
<Badge variant="outline">{row.original.attributes.eventType}</Badge>

// experience column (children pattern already in place)
<Badge variant="outline">{short label}</Badge>

// day column
<Badge variant="outline">{dayName}</Badge>
```

Remove the `ConceptBadge` import; ensure `Badge` is imported.

### `src/ui/Badge/Badge.test.tsx`

Remove the entire `describe('conceptBadge', ...)` block (lines 81–118). These tests documented broken behavior, not correct behavior.

### `TODO.md`

Remove the DS-16 section.

## Testing

- Existing `Badge` and `BoolBadge` tests are unaffected.
- No new tests needed: `Badge variant="outline"` is already covered by the outline variant test.
- `conceptColors.test.ts` is deleted along with the source file.
