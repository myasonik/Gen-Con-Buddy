# useStoredState Version-Bump Silent Storage Corruption

**Severity:** MEDIUM  
**Confidence:** 9/10  
**Repo:** Gen-Con-Buddy  
**File:** `src/hooks/useStoredState.ts`

## Problem

`useStoredState(key, version, default)` reads from storage in a `useState` initializer (one-shot) but writes via `useEffect([key, version, value])`. If `version` increases mid-lifecycle, the effect fires and writes the OLD stale `value` under the NEW version key, silently corrupting storage with data that should have been discarded.

All current consumers pass module-level constants so the bug is latent — `version` never changes mid-lifecycle in practice. But there is no type-level guard preventing a dynamic value from being passed.

## Fix

1. **Write a regression test first** — add a test to `useStoredState.test.ts` that simulates a version change mid-lifecycle and asserts the new version key is NOT written with the old value.
2. Then fix: either add a re-read effect that resets `value` to default when `version` changes before the write effect runs, or constrain `version` to a literal type / add a runtime invariant that it cannot change after mount.
3. Do not attempt the fix without the regression test in place.
