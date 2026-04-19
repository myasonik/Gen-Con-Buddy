# Reset Column Visibility to Defaults

**Date:** 2026-04-18

## Overview

Add a "Reset to defaults" button to the column picker panel in search results. Clicking it immediately restores column visibility to the hardcoded defaults without any confirmation prompt.

## Architecture

No new files. Two small changes to existing files.

### `src/hooks/useColumnVisibility.ts`

Add a `reset` function:

```ts
const reset = () => setVisibility({ ...DEFAULTS });
```

Return it alongside `visibility` and `toggle`. The existing `useEffect` already syncs state to localStorage on every change, so reset persists automatically.

### `src/components/SearchResults/SearchResults.tsx`

Destructure `reset` from `useColumnVisibility`. Add a `<button>` inside the `<fieldset>` in the "Customize columns" `<details>` panel:

```tsx
<button type="button" onClick={reset}>
  Reset to defaults
</button>
```

## Data Flow

1. User clicks "Reset to defaults"
2. `reset()` calls `setVisibility({ ...DEFAULTS })`
3. React re-renders the checkbox list to reflect defaults
4. `useEffect` fires and writes the reset state to `localStorage`

## Error Handling

None needed — reset is a pure in-memory state update with no async operations or external dependencies.

## Testing

- Unit test on `useColumnVisibility`: toggle a column, call `reset`, assert visibility matches `DEFAULTS`
- Component test on `SearchResults`: toggle a column off, click "Reset to defaults", assert the column checkbox is back to its default state
