# useStoredState Version-Change Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `useStoredState` so that a mid-lifecycle version change resets state to the correct default value instead of writing stale data under the new version key.

**Architecture:** Add a `prevVersionRef` to track the version seen on the previous render. The existing write `useEffect` becomes a combined effect: when version is stable it writes as before; when version has changed it re-reads from storage (returning `defaultValue` since the stored version won't match) and skips the write — the correct write happens on the next render after state settles.

**Tech Stack:** React (`useRef`, `useEffect`), Vitest, `@testing-library/react` (`renderHook`, `act`).

---

### Task 1: Write the failing regression test

**Files:**

- Modify: `src/hooks/useStoredState.test.ts`

- [ ] **Step 1: Add the regression test to `useStoredState.test.ts`**

Append this test after the existing `"falls back to default when stored entry has matching version but no value key"` test:

```typescript
test("does not write stale value to storage when version changes mid-lifecycle", () => {
  const { result, rerender } = renderHook(
    ({ version }: { version: number }) => useStoredState(KEY, version, { count: 0 }),
    { initialProps: { version: 1 } },
  );

  // Set a value under version 1
  act(() => {
    result.current[1]({ count: 99 });
  });

  // Confirm version 1 data is in storage
  expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toStrictEqual({
    version: 1,
    value: { count: 99 },
  });

  // Change version mid-lifecycle
  act(() => {
    rerender({ version: 2 });
  });

  // State must reset to default — old value belongs to version 1
  expect(result.current[0]).toStrictEqual({ count: 0 });

  const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");

  // Storage must NOT contain stale version-1 data under the version-2 key
  expect(stored).not.toStrictEqual({ version: 2, value: { count: 99 } });

  // Storage must contain the correct version-2 write (default value)
  expect(stored).toStrictEqual({ version: 2, value: { count: 0 } });
});
```

- [ ] **Step 2: Run the new test alone to confirm it fails**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy
npx vitest run src/hooks/useStoredState.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: the new test FAILs. The assertion `expect(stored).not.toStrictEqual({ version: 2, value: { count: 99 } })` is the one that fails — the current implementation writes stale data.

- [ ] **Step 3: Confirm all pre-existing tests still pass**

```bash
npx vitest run src/hooks/useStoredState.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all tests except the new one pass (7 pass, 1 fail).

---

### Task 2: Implement the fix

**Files:**

- Modify: `src/hooks/useStoredState.ts`

- [ ] **Step 1: Replace the write effect with the combined version-tracking effect**

Open `src/hooks/useStoredState.ts`. The current file reads:

```typescript
import { useState, useEffect } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

export function useStoredState<T>(
  key: string,
  version: number,
  defaultValue: T,
): [T, (next: SetStateAction<T>) => void] {
  const [value, setValue] = useState<T>(() => readFromStorage(key, version, defaultValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ version, value }));
    } catch {
      // ignore write errors
    }
  }, [key, version, value]);

  const setStoredValue = (next: SetStateAction<T>): void => {
    setValue((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  };

  return [value, setStoredValue];
}
```

Replace it with:

```typescript
import { useState, useEffect, useRef } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

export function useStoredState<T>(
  key: string,
  version: number,
  defaultValue: T,
): [T, (next: SetStateAction<T>) => void] {
  const [value, setValue] = useState<T>(() => readFromStorage(key, version, defaultValue));
  const prevVersionRef = useRef(version);

  useEffect(() => {
    if (prevVersionRef.current === version) {
      try {
        localStorage.setItem(key, JSON.stringify({ version, value }));
      } catch {
        // ignore write errors
      }
    } else {
      prevVersionRef.current = version;
      setValue(readFromStorage(key, version, defaultValue));
    }
  }, [key, version, value, defaultValue]);

  const setStoredValue = (next: SetStateAction<T>): void => {
    setValue((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  };

  return [value, setStoredValue];
}

function readFromStorage<T>(key: string, version: number, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return defaultValue;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== version
    ) {
      return defaultValue;
    }
    const stored = parsed as { version: number; value?: T };
    if (stored.value === undefined) {
      return defaultValue;
    }
    return stored.value;
  } catch {
    return defaultValue;
  }
}
```

- [ ] **Step 2: Run the full test file to confirm all 8 tests pass**

```bash
npx vitest run src/hooks/useStoredState.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all 8 tests pass, 0 failures.

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useStoredState.ts src/hooks/useStoredState.test.ts
git commit -m "$(cat <<'EOF'
fix: prevent stale write in useStoredState when version changes mid-lifecycle

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
