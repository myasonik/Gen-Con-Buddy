---
name: Eyebrow typography pattern is a duplicated mini-component
description: The slab/uppercase/sm/600/eyebrow-tracking/ink-muted block is duplicated 14+ times across CSS modules with no shared composable class
type: project
---

The "eyebrow" treatment — `font-family: var(--font-slab); font-size: var(--text-sm); font-weight: 600; letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--color-ink-muted);` — appears in at least these files (as of 2026-05-06):

- src/ui/Field/Field.module.css `.label`
- src/ui/DescriptionList/DescriptionList.module.css `.dt` (with font-weight: 400)
- src/ui/EmptyState/EmptyState.module.css `.text` (with font-size: --text-base)
- src/ui/Drawer/Drawer.module.css
- src/ui/Chip/Chip.module.css
- src/components/SearchForm/SearchForm.module.css `.legend`, `.label`, `.stripLabel`, `.dayToggle`
- src/components/EventTypeSelect/EventTypeSelect.module.css `.label`
- src/components/Pagination/Pagination.module.css `.perPageLabel`
- src/components/EventTable/EventTable.module.css (3 places), EventListMobile.module.css
- src/components/EventDetail/EventDetail.module.css
- src/components/AboutPage/AboutPage.module.css
- src/components/ChangelogPage/ChangelogEntryPanel.module.css
- src/routes/\_\_root.module.css `.nav`, `.footerLink`

**Why:** It is the project's eyebrow typography role — recognizable, repeated, and clearly a single design decision. Each call site re-declaring 5–6 properties means a treatment change requires a sweep across ~14 files (issue #29 already showed this — `<select>` labels drifted because one consumer omitted `font-family`).

**How to apply:** Recommend a shared CSS Module utility at `src/styles/eyebrow.module.css` exporting `.eyebrow` (canonical) and optionally `.eyebrowFaint` / size variants, consumed via `composes: eyebrow from "../../styles/eyebrow.module.css"`. Precedent already exists in the codebase: `src/styles/popup.module.css` is consumed via `composes:` from 4 modules. Per-module duplication is NOT fine here — the role is named ("eyebrow" is even a token name) and has already drifted once.
