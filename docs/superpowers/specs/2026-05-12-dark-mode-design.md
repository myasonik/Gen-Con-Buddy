# Dark Mode Design Spec

**Date:** 2026-05-12
**Status:** Approved

## Overview

Add a user-controllable dark mode to Gen Con Buddy. Users can choose Light, Dark, or Auto (follows OS preference). The default is Auto. The palette is warm dark — amber-tinged near-blacks that read as "book by firelight," not "developer terminal."

---

## 1. Token Layer

All color tokens live in `src/styles/tokens.css`. The existing `:root` block remains unchanged (light mode). A new `[data-theme="dark"]` block overrides only the color tokens.

### Dark palette values

```css
[data-theme="dark"] {
  /* Surfaces — amber anchor (48°) for page, graduating toward 60° for panels */
  --color-surface-page: oklch(18% 0.016 48deg);
  --color-surface-panel: oklch(22% 0.018 55deg);
  --color-surface-row-alt: oklch(20% 0.017 52deg);
  --color-surface-hover: oklch(26% 0.02 55deg);

  /* Ink — warm near-white, cooler than surfaces for analog spread */
  --color-ink: oklch(90% 0.014 66deg);
  --color-ink-muted: oklch(72% 0.02 64deg);
  --color-ink-faint: oklch(55% 0.018 62deg);
  --color-ink-border: oklch(35% 0.022 58deg);
  --color-ink-divider: oklch(28% 0.016 56deg);

  /* Accent — sienna brightened for dark background readability */
  --color-accent: oklch(66% 0.14 34deg);
  --color-accent-deep: oklch(58% 0.16 34deg); /* darker = pushed/engaged, matches light semantics */
  --color-accent-surface: oklch(24% 0.06 38deg);

  /* Semantic surface tints */
  --color-jade-surface: oklch(18% 0.03 148deg);
  --color-cobalt-surface: oklch(18% 0.03 235deg);
  --color-amber-surface: oklch(20% 0.035 62deg);
  --color-error-surface: oklch(18% 0.04 22deg);

  /* Scrim — explicit override required: --color-scrim derives from --color-ink,
     which in dark mode becomes near-white, producing a cream modal backdrop.
     This override prevents that inversion. */
  --color-scrim: oklch(8% 0.01 48deg / 0.6);
}
```

**Why explicit `--color-scrim`:** `tokens.css` derives `--color-scrim` from `var(--color-ink)` via `oklch(from var(--color-ink) l c h / 0.4)`. In dark mode `--color-ink` becomes near-white, making the scrim cream-colored. The override restores a near-black warm scrim for modal/drawer backdrops.

**Why `accent-deep` is darker (not lighter):** In light mode, "deep" means pushed toward darkness — the hover/active state against a light surface. In dark mode the same semantic applies: hover should deepen, not lighten. `oklch(58%)` is darker than `oklch(66%)`, preserving the token's meaning across themes.

### Hardcoded values to migrate during implementation

Three existing values are hardcoded outside the token system and will not respond to `[data-theme="dark"]`. They must be fixed as part of this work:

| File                              | Line         | Current value                  | Problem                               | Fix                                                                    |
| --------------------------------- | ------------ | ------------------------------ | ------------------------------------- | ---------------------------------------------------------------------- |
| `src/styles/popup.module.css`     | `box-shadow` | `oklch(22% 0.03 48deg / 0.12)` | Shadow stays light-mode faint in dark | Tokenize as `--color-shadow` or reference `--color-ink` at low opacity |
| `src/ui/Chip/Chip.module.css`     | error border | `oklch(78% 0.07 22deg)`        | Light-mode border washes out in dark  | Use `--color-error-border` token (already exists in `:root`)           |
| `src/ui/Drawer/Drawer.module.css` | backdrop     | `oklch(22% 0.03 48deg / 0.4)`  | Predates `--color-scrim` token        | Replace with `var(--color-scrim)`                                      |

---

## 2. `useTheme` Hook

**File:** `src/hooks/useTheme.ts`

```ts
type ThemePreference = "light" | "dark" | "auto";
```

### Shape (mirrors `useTimeFormat`)

```ts
export function useTheme(): {
  theme: ThemePreference;
  setTheme: (v: ThemePreference) => void;
  reset: () => void;
};
```

### Internals

- **Persistence:** `useStoredState("gcb-theme", 1, "auto")` — same versioned localStorage pattern as all other user preferences.
- **Resolution:** `useMediaQuery("(prefers-color-scheme: dark)")` provides the OS preference. When `theme === "auto"`, the resolved value is the media query result. When `theme` is explicit, the media query is ignored for resolution.
- **DOM application:** A `useEffect` sets both attributes on `document.documentElement` whenever the resolved theme changes:
  ```ts
  document.documentElement.setAttribute("data-theme", resolved); // "light" | "dark"
  document.documentElement.style.colorScheme = resolved; // native browser chrome
  ```
  `colorScheme` is required so the browser renders scrollbars, form inputs, and other native chrome in the matching palette.
- **OS change announcement:** A second `useEffect` listens to the media query and calls `announce()` when it fires while `theme === "auto"`. Message: `"Theme updated to dark (Auto)"` or `"Theme updated to light (Auto)"`. This ensures silent OS-driven switches are not silent for screen reader users or users who have forgotten they set Auto.

### Placement

`useTheme` is called once in `AppShell` (`src/routes/__root.tsx`). `theme` and `setTheme` are passed as props to `ThemePopover` — no context or provider needed.

---

## 3. FOUC Prevention

**Problem:** `useEffect` fires after the first paint. Users with `"dark"` stored in localStorage will see the cream parchment background (`oklch(92.5% 0.016 72deg)`) flash before dark mode applies.

**Fix:** Add a blocking inline `<script>` to `index.html` that reads localStorage and sets `data-theme` on `<html>` before React mounts. This cannot live in a React hook — it must execute synchronously in the `<head>`.

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem("gcb-theme");
      var parsed = stored ? JSON.parse(stored) : null;
      var pref = parsed && parsed.version === 1 ? parsed.value : "auto";
      var resolved =
        pref === "auto"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : pref;
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
</script>
```

The script mirrors the storage key (`gcb-theme`) and version (`1`) from `useStoredState`. If the key changes or version bumps, this script must be updated in sync.

---

## 4. `ThemePopover` Component

**File:** `src/components/ThemePopover/ThemePopover.tsx`

### Structure

An icon button in the `__root.tsx` nav header that opens a `@base-ui/react` Popover (same pattern as `ColumnActionsPopover`). Inside: a `<fieldset>` with `<legend>Theme</legend>` wrapping a `RadioGroup` with three `Radio` options.

### Trigger icon

The trigger shows the **stored preference**, not the resolved state:

| Preference | Icon                                                  |
| ---------- | ----------------------------------------------------- |
| `"auto"`   | `Eclipse.tsx` — split circle (half light / half dark) |
| `"light"`  | `Sun.tsx`                                             |
| `"dark"`   | `Moon.tsx`                                            |

Showing the preference (not the resolved state) matches every major platform's convention and prevents confusion when a user in Auto mode sees a moon in the nav and thinks they enabled dark mode deliberately.

### Popover radio options

Three options: Light, Dark, Auto. Each option shows its icon + label text. When `theme === "auto"`, a subordinate line beneath the Auto radio reads "Currently: Light" or "Currently: Dark" — making the preference/resolved distinction explicit at the point of use without changing the radio semantics.

### Behavior

- Selecting a radio immediately applies the theme (token-level, instant) and closes the popover.
- Changes announced via `announce()`: `"Theme: Dark"`, `"Theme: Light"`, `"Theme: Auto"`.
- The trigger button has `aria-label` reflecting the current preference: `"Theme: Auto"`, `"Theme: Light"`, `"Theme: Dark"`.

### Placement

Rendered in the `<nav>` in `AppShell`, after the existing nav links.

---

## 5. Icons

Three new icon components in `src/ui/icons/`, sourced from game-icons.net, built with `createIcon`:

| Component     | game-icons.net source                     | Use                   |
| ------------- | ----------------------------------------- | --------------------- |
| `Sun.tsx`     | `sun` or `sunbeams`                       | Light mode preference |
| `Moon.tsx`    | `crescent` or `half-moon`                 | Dark mode preference  |
| `Eclipse.tsx` | `eclipse` or closest split-circle variant | Auto mode preference  |

If game-icons.net does not have a clean vertically-split circle, the fallback is a yin-yang variant or a custom SVG path (half fill, half stroke) matching the icon style.

---

## 6. Testing

### `useTheme.test.ts`

- Defaults to `"auto"` when localStorage is empty
- Persists preference to localStorage via `useStoredState`
- Resolves `"auto"` to `"dark"` when `prefers-color-scheme: dark` matches
- Sets `data-theme="dark"` on `document.documentElement` when resolved to dark
- Sets `colorScheme` style on `document.documentElement`
- Calls `announce()` when OS preference changes while theme is `"auto"`
- Does not call `announce()` on OS change when theme is explicit (`"light"` or `"dark"`)
- Stale/missing localStorage falls back to `"auto"`

### `ThemePopover.test.tsx`

- Renders three radio options: Light, Dark, Auto
- Trigger icon reflects stored preference (Auto → Eclipse icon, not Moon when OS is dark)
- Shows "Currently: Dark" subordinate label when Auto is selected and OS is dark
- Selecting a radio calls `setTheme` with the correct value
- Popover closes after selection
- `aria-label` on trigger reflects current preference

### No MSW handlers needed — no network interaction.

---

## 7. Implementation Notes

- The FOUC script in `index.html` must stay in sync with the localStorage key (`gcb-theme`) and version (`1`) used in `useTheme`. If either changes, the script must be updated.
- `colorScheme` on `documentElement` affects native browser chrome only (scrollbars, form inputs not styled by CSS). The existing `global.css` scrollbar rules use tokens and will respond to `[data-theme="dark"]` automatically.
- The `Drawer` backdrop already uses a hardcoded value that must be migrated to `var(--color-scrim)` — otherwise the dark scrim override in the token layer has no effect on drawer backdrops.
- The three hardcoded values listed in section 1 are blocking — they produce visible bugs in dark mode and must ship with this feature, not after.
- The derived border tokens (`--color-jade-border`, `--color-cobalt-border`, `--color-amber-border`, `--color-accent-border`) use CSS relative color syntax referencing their respective surface tokens. They update automatically when surface tokens are overridden in `[data-theme="dark"]` — no explicit dark-mode override is needed for them.
