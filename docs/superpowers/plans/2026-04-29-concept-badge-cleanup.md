# DS-16: ConceptBadge Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete `ConceptBadge`, its dead color utilities, and its broken CSS; replace the three call sites with `<Badge variant="outline">`.

**Architecture:** Pure deletion + call-site swap. No new code is introduced. `conceptColors.ts` and its test are removed entirely. `ConceptBadge` and `ConceptBadgeProps` are removed from `Badge.tsx`. `.conceptBadge` is removed from CSS. Three call sites in `columns.tsx` move to `<Badge variant="outline">`.

**Tech Stack:** React, TypeScript, CSS Modules, Vitest

---

### Task 1: Delete dead utility files

**Files:**
- Delete: `src/utils/conceptColors.ts`
- Delete: `src/utils/conceptColors.test.ts`

- [ ] **Step 1: Delete both files**

```bash
rm src/utils/conceptColors.ts src/utils/conceptColors.test.ts
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests pass. Nothing imports `conceptColors.ts` except its own test file, so deleting both together leaves no broken imports.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(DS-16): delete conceptColors utility and its test"
```

---

### Task 2: Remove broken-state tests from Badge.test.tsx

The `describe('conceptBadge', ...)` block (lines 81–118) asserts that CSS vars are empty strings — it documents broken behavior, not correct behavior. Remove it before touching `Badge.tsx` so the file compiles cleanly throughout.

**Files:**
- Modify: `src/ui/Badge/Badge.test.tsx`

- [ ] **Step 1: Delete the `conceptBadge` describe block**

Remove lines 81–118 from `src/ui/Badge/Badge.test.tsx`. The file should end after the closing `})` of the `boolBadge` describe block. The result:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, BoolBadge } from './Badge'

describe('badge', () => {
  it('renders children', () => {
    render(<Badge>ticketed</Badge>)
    expect(screen.getByText('ticketed')).toBeInTheDocument()
  })

  it('applies filled variant by default', () => {
    render(<Badge>ticketed</Badge>)
    expect(screen.getByText('ticketed')).toHaveAttribute('data-variant', 'filled')
  })

  it('forwards className prop', () => {
    render(<Badge className="custom-class">ticketed</Badge>)
    expect(screen.getByText('ticketed').closest('span')).toHaveClass('custom-class')
  })

  it('applies outline variant', () => {
    render(<Badge variant="outline">free</Badge>)
    expect(screen.getByText('free')).toHaveAttribute('data-variant', 'outline')
  })
})

describe('boolBadge', () => {
  it('shows ✓ for true', () => {
    render(<BoolBadge value />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it("shows ✓ for 'yes' string (case-insensitive)", () => {
    render(<BoolBadge value="yes" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it("shows ✓ for 'Yes' (capitalized)", () => {
    render(<BoolBadge value="Yes" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('shows — for false', () => {
    render(<BoolBadge value={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it("shows — for 'no' string", () => {
    render(<BoolBadge value="no" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows — for empty string', () => {
    render(<BoolBadge value="" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it("shows sr-only 'yes' for true", () => {
    render(<BoolBadge value />)
    expect(screen.getByText('yes')).toBeInTheDocument()
  })

  it("shows sr-only 'no' for false", () => {
    render(<BoolBadge value={false} />)
    expect(screen.getByText('no')).toBeInTheDocument()
  })

  it('renders both glyph and sr-only text for true', () => {
    render(<BoolBadge value />)
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('yes')).toBeInTheDocument()
  })

  it('renders both glyph and sr-only text for false', () => {
    render(<BoolBadge value={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('no')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they still pass**

```bash
npm test -- --reporter=verbose src/ui/Badge/Badge.test.tsx
```

Expected: 14 tests pass (4 badge + 10 boolBadge), 0 fail.

---

### Task 3: Remove ConceptBadge from Badge.tsx and Badge.module.css

**Files:**
- Modify: `src/ui/Badge/Badge.tsx`
- Modify: `src/ui/Badge/Badge.module.css`

- [ ] **Step 1: Update Badge.tsx — remove ConceptBadgeProps and ConceptBadge**

Replace the entire file contents with:

```tsx
import React from 'react'
import clsx from 'clsx'
import styles from './Badge.module.css'

export const BADGE_VARIANTS = ['filled', 'outline'] as const
export type BadgeVariant = (typeof BADGE_VARIANTS)[number]

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'filled', className }: BadgeProps): JSX.Element {
  return (
    <span
      data-variant={variant}
      className={clsx(styles.badge, styles[variant], className)}
    >
      {children}
    </span>
  )
}

interface BoolBadgeProps {
  value: string | boolean
  className?: string
}

export function BoolBadge({ value, className }: BoolBadgeProps): JSX.Element {
  const isYes = value === true || (typeof value === 'string' && value.toLowerCase() === 'yes')
  // Gen Con API returns "Yes"/"No" strings; true/false booleans also accepted
  return (
    <span className={clsx(isYes ? styles.boolYes : styles.boolNo, className)}>
      <span aria-hidden="true">{isYes ? '✓' : '—'}</span>
      <span className="sr-only">{isYes ? 'yes' : 'no'}</span>
    </span>
  )
}
```

- [ ] **Step 2: Update Badge.module.css — remove .conceptBadge block**

Replace the entire file contents with:

```css
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
}
```

- [ ] **Step 3: Run Badge tests to confirm they pass**

```bash
npm test -- --reporter=verbose src/ui/Badge/Badge.test.tsx
```

Expected: 14 tests pass. (The full test suite will fail at this point because `columns.tsx` still imports `ConceptBadge` — that's fine, fix it in the next task.)

- [ ] **Step 4: Run typecheck to catch the import error in columns.tsx (expected)**

```bash
npm run typecheck 2>&1 | grep conceptBadge
```

Expected: error about `ConceptBadge` not being exported from `Badge`. This confirms columns.tsx needs updating — handled in Task 4.

---

### Task 4: Update columns.tsx call sites

**Files:**
- Modify: `src/ui/EventTable/columns.tsx`

- [ ] **Step 1: Update the import on line 4**

Change:
```tsx
import { ConceptBadge } from '../Badge/Badge'
```
To:
```tsx
import { Badge } from '../Badge/Badge'
```

- [ ] **Step 2: Update the eventType cell (line 47)**

Change:
```tsx
cell: ({ row }) => (
  <ConceptBadge concept="eventType" value={row.original.attributes.eventType} />
),
```
To:
```tsx
cell: ({ row }) => (
  <Badge variant="outline">{row.original.attributes.eventType}</Badge>
),
```

- [ ] **Step 3: Update the experienceRequired cell (lines 112–119)**

Change:
```tsx
cell: ({ row }) => {
  const raw = row.original.attributes.experienceRequired
  return (
    <ConceptBadge concept="experience" value={raw}>
      {EXP[raw] ?? raw}
    </ConceptBadge>
  )
},
```
To:
```tsx
cell: ({ row }) => {
  const raw = row.original.attributes.experienceRequired
  return <Badge variant="outline">{EXP[raw] ?? raw}</Badge>
},
```

- [ ] **Step 4: Update the day cell (lines 143–146)**

Change:
```tsx
cell: ({ row }) => {
  const dayName = format(new Date(row.original.attributes.startDateTime), 'EEEE')
  return <ConceptBadge concept="day" value={dayName} />
},
```
To:
```tsx
cell: ({ row }) => {
  const dayName = format(new Date(row.original.attributes.startDateTime), 'EEEE')
  return <Badge variant="outline">{dayName}</Badge>
},
```

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/ui/Badge/Badge.tsx src/ui/Badge/Badge.module.css src/ui/Badge/Badge.test.tsx src/ui/EventTable/columns.tsx
git commit -m "feat(DS-16): replace ConceptBadge with Badge outline variant; delete dead color CSS"
```

---

### Task 5: Remove DS-16 from TODO.md

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Delete the DS-16 section**

Remove the entire `## DS-16 — ConceptBadge CSS vars never set; conceptColors.ts is dead code` section from `TODO.md`, including the problem description and fix steps below it. Leave the rest of the file intact.

- [ ] **Step 2: Commit**

```bash
git add TODO.md
git commit -m "chore: remove DS-16 from TODO (completed)"
```
