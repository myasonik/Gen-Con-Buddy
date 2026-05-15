# useStoredState Version-Change Fix

**Date:** 2026-05-15  
**Status:** Approved  
**Related todo:** `todo/hardening-04-usestoredstate-version-miswrite.md`

## Problem

`useStoredState(key, version, defaultValue)` reads from storage in a `useState` initializer (one-shot, mount only). It writes via `useEffect([key, version, value])`. If `version` changes mid-lifecycle, the effect fires and writes the **old stale `value`** under the **new version key**, silently corrupting storage with data that should have been discarded.

All six current consumers pass module-level `VERSION = 1` constants, so the bug never triggers in practice. But there is no runtime guard preventing a dynamic value from being passed.

## Fix Strategy

**Behavioral fix** — handle version changes gracefully in the effect itself, without throwing.

Replace the current write-only `useEffect` with a single combined effect that tracks the previous version via a ref:

- `version === prevVersionRef.current` (stable): write to storage as today.
- `version !== prevVersionRef.current` (changed): update the ref, call `setValue(readFromStorage(key, version, defaultValue))` to reset state to the correct value for the new version (which is `defaultValue` since stored data will carry the old version number), and return early — **no write**. The write happens on the next render once `value` has settled.

`defaultValue` is added to the effect dep array because it is used in the version-changed branch. All current consumers pass module-level constants so this introduces no referential-equality instability.

## Test (written first)

File: `src/hooks/useStoredState.test.ts`

New test: `"does not write stale value to storage when version changes mid-lifecycle"`

1. Render hook with `version=1` and `defaultValue={ count: 0 }`.
2. Mutate state to `{ count: 99 }` via `act`.
3. Confirm storage contains `{ version: 1, value: { count: 99 } }`.
4. `rerender({ version: 2 })` inside `act` to flush all effects.
5. **Assert:** `result.current[0]` equals `{ count: 0 }` — state reset to default.
6. **Assert:** storage does **not** contain `{ version: 2, value: { count: 99 } }` — no stale write.
7. **Assert:** storage contains `{ version: 2, value: { count: 0 } }` — correct write after re-render.

This test **fails** on the current implementation (step 6 fails — stale value gets written) and **passes** after the fix.

## Implementation

File: `src/hooks/useStoredState.ts`

```typescript
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
```

The `useState` initializer and `setStoredValue` helper are unchanged.

## Scope

No consumer changes required. No new files. Changes confined to `useStoredState.ts` and `useStoredState.test.ts`.
