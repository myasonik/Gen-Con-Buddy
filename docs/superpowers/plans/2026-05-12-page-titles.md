# Page Titles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every page in Gen Con Buddy sets a meaningful `document.title` so browser tabs and history show useful names instead of the static "Gen Con Buddy".

**Architecture:** A single `usePageTitle(title: string | undefined)` hook in `src/lib/` sets `document.title` imperatively and resets it to `"Gen Con Buddy"` on unmount. Each page component calls the hook with its title string; the event detail page passes `undefined` while data is loading so the title is left unchanged until the event name is available.

**Tech Stack:** React `useEffect`, `@testing-library/react` `renderHook` for hook unit tests, MSW + `renderRoute` for route-level integration tests.

---

### Task 1: Create the `usePageTitle` hook (TDD)

**Files:**

- Create: `src/lib/usePageTitle.test.ts`
- Create: `src/lib/usePageTitle.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/usePageTitle.test.ts`:

```ts
import { renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { usePageTitle } from "./usePageTitle";

afterEach(() => {
  document.title = "Gen Con Buddy";
});

test("sets document.title when given a non-empty string", () => {
  renderHook(() => usePageTitle("Dungeon Crawl Classic (RPG24000042) | Gen Con Buddy"));
  expect(document.title).toBe("Dungeon Crawl Classic (RPG24000042) | Gen Con Buddy");
});

test("does nothing when given undefined", () => {
  document.title = "Previous Title";
  renderHook(() => usePageTitle(undefined));
  expect(document.title).toBe("Previous Title");
});

test("resets document.title to 'Gen Con Buddy' on unmount", () => {
  const { unmount } = renderHook(() => usePageTitle("Some Page | Gen Con Buddy"));
  unmount();
  expect(document.title).toBe("Gen Con Buddy");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run src/lib/usePageTitle.test.ts
```

Expected: 3 failures — `usePageTitle` does not exist yet.

- [ ] **Step 3: Implement the hook**

Create `src/lib/usePageTitle.ts`:

```ts
import { useEffect } from "react";

export function usePageTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    return () => {
      document.title = "Gen Con Buddy";
    };
  }, [title]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run src/lib/usePageTitle.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/usePageTitle.ts src/lib/usePageTitle.test.ts
git commit -m "feat: add usePageTitle hook"
```

---

### Task 2: Set dynamic title on the event detail page (TDD)

**Files:**

- Modify: `src/routes/event.$id.test.tsx` — add one test
- Modify: `src/components/EventDetail/EventDetail.tsx` — call `usePageTitle`

- [ ] **Step 1: Write the failing test**

Add this test at the end of `src/routes/event.$id.test.tsx`:

```ts
test("sets document.title to event title and gameId after data loads", async () => {
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const gameId = url.searchParams.get("gameId") ?? "RPG24000042";
      return HttpResponse.json<EventSearchResponse>({
        data: [makeEvent({ gameId, title: "Dungeon Crawl Classic" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      });
    }),
  );
  await renderRoute("/event/RPG24000042", { queryClient });
  await screen.findAllByRole("term");
  expect(document.title).toBe("Dungeon Crawl Classic (RPG24000042) | Gen Con Buddy");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run src/routes/event.\$id.test.tsx
```

Expected: the new test fails; the 13 existing tests pass.

- [ ] **Step 3: Implement in EventDetail**

In `src/components/EventDetail/EventDetail.tsx`:

1. Add the import after the existing lib imports:

```ts
import { usePageTitle } from "../../lib/usePageTitle";
```

2. Add the hook call after `useDayFormat` on line 33 (currently `const { dayFormat } = useDayFormat();`):

```ts
const { dayFormat } = useDayFormat();
usePageTitle(
  event ? `${event.attributes.title} (${event.attributes.gameId}) | Gen Con Buddy` : undefined,
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run src/routes/event.\$id.test.tsx
```

Expected: 14 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventDetail/EventDetail.tsx src/routes/event.\$id.test.tsx
git commit -m "feat: set page title on event detail page"
```

---

### Task 3: Set static titles on the remaining pages (TDD)

**Files:**

- Modify: `src/routes/index.test.tsx` — add one test
- Modify: `src/routes/index.tsx` — call `usePageTitle` in `SearchPage`
- Modify: `src/routes/about.test.tsx` — add one test
- Modify: `src/components/AboutPage/AboutPage.tsx` — call `usePageTitle`
- Modify: `src/routes/changelog.test.tsx` — add one test
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx` — call `usePageTitle`

- [ ] **Step 1: Write the three failing tests**

Add to the end of `src/routes/index.test.tsx`:

```ts
test("sets document.title to 'Gen Con Buddy'", async () => {
  await renderRoute("/");
  expect(document.title).toBe("Gen Con Buddy");
});
```

Add to the end of `src/routes/about.test.tsx`:

```ts
test("sets document.title to 'About | Gen Con Buddy'", async () => {
  await renderAboutPage();
  expect(document.title).toBe("About | Gen Con Buddy");
});
```

Add to the end of `src/routes/changelog.test.tsx` (before any closing brackets — it goes at the top-level `test` scope, not inside a `describe`):

```ts
test("sets document.title to 'Changelog | Gen Con Buddy'", async () => {
  await renderChangelogPage();
  expect(document.title).toBe("Changelog | Gen Con Buddy");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run src/routes/index.test.tsx src/routes/about.test.tsx src/routes/changelog.test.tsx
```

Expected: 3 new tests fail; all existing tests in those files pass.

- [ ] **Step 3: Implement in SearchPage**

In `src/routes/index.tsx`, add the import below the existing imports:

```ts
import { usePageTitle } from "../lib/usePageTitle";
```

Add the hook call as the first line of the `SearchPage` function body (line 20, currently `const posthog = usePostHog();`):

```ts
function SearchPage(): React.JSX.Element {
  usePageTitle("Gen Con Buddy");
  const posthog = usePostHog();
  // ... rest unchanged
```

- [ ] **Step 4: Implement in AboutPage**

In `src/components/AboutPage/AboutPage.tsx`, add the import after the existing imports:

```ts
import { usePageTitle } from "../../lib/usePageTitle";
```

Add the hook call as the first line of the `AboutPage` function body:

```ts
export function AboutPage(): React.JSX.Element {
  usePageTitle("About | Gen Con Buddy");
  return (
    // ... rest unchanged
```

- [ ] **Step 5: Implement in ChangelogPage**

In `src/components/ChangelogPage/ChangelogPage.tsx`, add the import after the existing imports:

```ts
import { usePageTitle } from "../../lib/usePageTitle";
```

Add the hook call as the first line of the `ChangelogPage` function body (just after the opening `{` of the function, before any existing hooks/state):

```ts
export function ChangelogPage({ ... }): React.JSX.Element {
  usePageTitle("Changelog | Gen Con Buddy");
  // ... rest unchanged
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run src/routes/index.test.tsx src/routes/about.test.tsx src/routes/changelog.test.tsx
```

Expected: all tests in those files pass, including the 3 new ones.

- [ ] **Step 7: Run the full test suite**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/routes/index.tsx src/routes/index.test.tsx \
        src/components/AboutPage/AboutPage.tsx src/routes/about.test.tsx \
        src/components/ChangelogPage/ChangelogPage.tsx src/routes/changelog.test.tsx
git commit -m "feat: set page titles on search, about, and changelog pages"
```
