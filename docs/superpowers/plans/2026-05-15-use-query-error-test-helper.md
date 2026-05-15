# useQuery Error-Branch Test Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a narrow MSW helper for error-branch tests, document the requirement in AGENTS.md, and fix the one remaining gap in ChangelogPage.

**Architecture:** A two-function test utility (`withNetworkError` / `withServerError`) wraps `server.use(...)` so error tests read as intent rather than boilerplate. The AGENTS.md addition makes the requirement explicit for future contributors. The ChangelogPage test closes the only remaining untested `isError` branch.

**Tech Stack:** Vitest, MSW (`msw` v2 — `http` and `HttpResponse` from `"msw"`), TanStack Query

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/test/apiError.ts` | Exports `withNetworkError` and `withServerError` |
| Modify | `src/components/ChangelogPage/ChangelogPage.test.tsx` | Add error-branch test |
| Modify | `AGENTS.md` | Document the requirement under ## Testing |

---

### Task 1: Create `src/test/apiError.ts`

**Files:**
- Create: `src/test/apiError.ts`

This is a test utility — it lives alongside `src/test/msw/` and `src/test/setup.ts`. It has no runtime imports; everything it touches is test-only.

- [ ] **Step 1: Create the file**

```ts
import { http, HttpResponse } from "msw";
import { server } from "./msw/server";

export function withNetworkError(url: string): void {
  server.use(http.get(url, () => HttpResponse.error()));
}

export function withServerError(url: string): void {
  server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));
}
```

- [ ] **Step 2: Verify the file type-checks cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/test/apiError.ts
git commit -m "test: add withNetworkError / withServerError MSW helpers"
```

---

### Task 2: Fix ChangelogPage error-branch test gap

**Files:**
- Modify: `src/components/ChangelogPage/ChangelogPage.test.tsx`

`ChangelogPage` already renders `<p>Could not load changelog. Try refreshing.</p>` when `isError` is true (line 98 of `ChangelogPage.tsx`). The behavior exists — it just has no test.

- [ ] **Step 1: Add the import for `withNetworkError` at the top of the test file**

Open `src/components/ChangelogPage/ChangelogPage.test.tsx`. The existing imports end around line 18. Add one import after the `server` import:

```ts
import { withNetworkError } from "../../test/apiError";
```

- [ ] **Step 2: Add the test at the end of the file**

Append after the last test:

```ts
test("shows error message when changelog list fetch fails", async () => {
  withNetworkError("/api/changelog/list");
  await renderChangelogPage();
  expect(
    screen.getByText("Could not load changelog. Try refreshing."),
  ).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the test to verify it passes**

```bash
TZ=America/Indianapolis npx vitest run src/components/ChangelogPage/ChangelogPage.test.tsx
```

Expected output includes:
```
✓ shows error message when changelog list fetch fails
```

All other tests in the file should still pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangelogPage/ChangelogPage.test.tsx
git commit -m "test: cover ChangelogPage isError branch"
```

---

### Task 3: Document the requirement in AGENTS.md

**Files:**
- Modify: `AGENTS.md`

The `## Testing` section starts at line 23 with: `All tests use MSW for network interception...` Add a new paragraph after the `src/test/setup.ts` timezone note (after line 27) and before the **Route tests vs. component tests** section.

- [ ] **Step 1: Add the paragraph**

Insert this block between the timezone note and the **Route tests vs. component tests** heading:

```markdown
Every `useQuery` call requires an MSW error test in its co-located test file. Use `withNetworkError()` or `withServerError()` from `src/test/apiError.ts` to register the override. Also cover the 200-with-error-envelope path for any fetch function that checks `data.error`.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: require error-branch MSW test for every useQuery consumer"
```
