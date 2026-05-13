# Page Titles Design

**Date:** 2026-05-12
**Issue:** #33

## Summary

Every page in Gen Con Buddy should set a meaningful `document.title`. Currently all pages show the static "Gen Con Buddy" from `index.html`.

## Title Format

| Route                                      | Title                                             |
| ------------------------------------------ | ------------------------------------------------- |
| `/`                                        | `Gen Con Buddy`                                   |
| `/changelog`                               | `Changelog \| Gen Con Buddy`                      |
| `/about`                                   | `About \| Gen Con Buddy`                          |
| `/event/$id` (loaded)                      | `{event.title} ({event.gameId}) \| Gen Con Buddy` |
| `/event/$id` (loading / error / not found) | _(unchanged — inherits default or last value)_    |

## Hook

**`src/lib/usePageTitle.ts`**

```ts
export function usePageTitle(title: string | undefined): void;
```

- When `title` is a non-empty string: sets `document.title = title` in a `useEffect`.
- When `title` is `undefined` or empty: does nothing (leaves the current title as-is).
- On unmount: resets `document.title` to `"Gen Con Buddy"`.

## Call Sites

- `src/routes/index.tsx` page component — `usePageTitle("Gen Con Buddy")`
- `src/routes/changelog.tsx` page component — `usePageTitle("Changelog | Gen Con Buddy")`
- `src/routes/about.tsx` page component — `usePageTitle("About | Gen Con Buddy")`
- `src/components/EventDetail/EventDetail.tsx` — `usePageTitle(event ? \`${a.title} (${a.gameId}) | Gen Con Buddy\` : undefined)`

The event detail component already has access to `event` and `a` (the event attributes) after the query resolves, so the conditional is a one-liner.

## Testing

### `src/lib/usePageTitle.test.ts` (new)

- Sets `document.title` when given a non-empty string
- Does nothing when given `undefined`
- Resets `document.title` to `"Gen Con Buddy"` on unmount

### `src/routes/event.$id.test.tsx` (new test)

- After event data loads, `document.title` equals `"${title} (${gameId}) | Gen Con Buddy"`

### `src/routes/index.test.tsx`, `changelog.test.tsx`, `about.test.tsx` (one assertion each)

- After render, `document.title` equals the expected static string for that page

## Out of Scope

- Open Graph / `<meta>` tags
- SSR / `<head>` injection via TanStack Router's `head` export
- Titles for error or loading states (they reset to the default on unmount, which is sufficient)
