<!-- DESIGN TARGET — existing CSS tokens do not yet reflect this spec. Run /impeccable craft to update them. -->

---

name: Gen Con Buddy
description: Your guide to the best four days in gaming.
colors:
surface-page: "#f2ece0"
surface-panel: "#e4dccf"
surface-row-alt: "#ece5d5"
surface-hover: "#dbd2c3"
ink: "#2a201a"
ink-muted: "#63503f"
ink-faint: "#988a7a"
ink-border: "#c2b5a5"
ink-divider: "#d8d0c2"
accent: "#954528"
accent-deep: "#7c3a1e"
typography:
display:
fontFamily: "'Cormorant Garamond', Georgia, serif"
fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
fontWeight: 700
lineHeight: 1.1
letterSpacing: "-0.01em"
fontFeature: "'kern' 1, 'liga' 1, 'onum' 1"
headline:
fontFamily: "'Cormorant Garamond', Georgia, serif"
fontSize: "1.5rem"
fontWeight: 600
lineHeight: 1.25
letterSpacing: "normal"
title:
fontFamily: "'Zilla Slab', Georgia, serif"
fontSize: "0.8125rem"
fontWeight: 600
lineHeight: 1.35
letterSpacing: "0.06em"
body:
fontFamily: "'Source Sans 3', system-ui, sans-serif"
fontSize: "1rem"
fontWeight: 400
lineHeight: 1.6
letterSpacing: "normal"
label:
fontFamily: "'Zilla Slab', Georgia, serif"
fontSize: "0.75rem"
fontWeight: 400
lineHeight: 1.4
letterSpacing: "0.05em"
code:
fontFamily: "'Courier Prime', 'Courier New', monospace"
fontSize: "0.875rem"
fontWeight: 400
lineHeight: 1.5
fontFeature: "'tnum' 1"
rounded:
subtle: "2px"
card: "4px"
pill: "9999px"
spacing:
xs: "0.25rem"
sm: "0.5rem"
md: "1rem"
lg: "1.5rem"
xl: "2rem"
2xl: "3rem"
components:
button-primary:
backgroundColor: "{colors.accent}"
textColor: "{colors.surface-page}"
rounded: "{rounded.subtle}"
padding: "0.625rem 1.25rem"
button-primary-hover:
backgroundColor: "{colors.accent-deep}"
textColor: "{colors.surface-page}"
rounded: "{rounded.subtle}"
padding: "0.625rem 1.25rem"
button-secondary:
backgroundColor: "transparent"
textColor: "{colors.ink}"
rounded: "{rounded.subtle}"
padding: "0.625rem 1.25rem"
button-ghost:
backgroundColor: "transparent"
textColor: "{colors.ink-muted}"
rounded: "{rounded.subtle}"
padding: "0.5rem 0.875rem"
filter-chip:
backgroundColor: "{colors.surface-panel}"
textColor: "{colors.ink-muted}"
rounded: "{rounded.pill}"
padding: "0.25rem 0.625rem"
filter-chip-active:
backgroundColor: "{colors.accent}"
textColor: "{colors.surface-page}"
rounded: "{rounded.pill}"
padding: "0.25rem 0.625rem"
input-field:
backgroundColor: "{colors.surface-page}"
textColor: "{colors.ink}"
rounded: "{rounded.subtle}"
padding: "0.5rem 0.75rem"

---

# Design System: Gen Con Buddy

## 1. Overview

**Creative North Star: "The Good Rulebook"**

Every gamer knows the difference between a bad rulebook and a good one. The bad one is walls of text, amateur layout, inconsistent terminology, designed by someone who clearly just wanted to ship the game. The good one is a pleasure to hold: warm paper, clear hierarchy, confident typography, organized by someone who respected the reader's intelligence and their time. Gen Con Buddy is the good rulebook. It handles dense, complex information — thirty-plus filter fields, hundreds of event records, scheduling logistics — and makes it feel navigable rather than overwhelming.

The visual reference is the shelf of modern euro games: Root, Arcs, Old King's Crown, Ticket to Ride. These are objects made with craft. Their colors come from ink on cardboard, not from a UI kit. Their typography comes from printing tradition: slab serifs for running catalog text, elegant display faces for titles, monospace for codes and references. Warmth comes from the paper itself — cream stock, not white. This is the physical world that the Gen Con attendee lives in. The app should feel native to it.

What this system explicitly rejects: the gray-on-white SaaS look that treats every interface as a project management tool; the corporate event app aesthetic (Eventbrite, conference schedulers) that strips all personality in the name of "clean"; and the digital-retro gaming look — neon grids, pixel fonts, Game Boy nostalgia — which mistakes the medium for the subject. Gen Con spans a hundred genres. It belongs to no single one.

**Key Characteristics:**

- Warm paper base, not white — cream stock that reads as physical before it reads as digital
- Ink-and-cardboard color palette: three deliberate roles, nothing borrowed
- Four-font typographic system, each with a distinct job — display, catalog, reading, data
- Minimal rounding — game cards have corners, not pills
- Flat by default — printed materials don't have shadows
- Sienna accent, used sparingly — the color of a wooden meeple, not a call-to-action button

## 2. Colors: The Three Roles Palette

The palette has three roles: a warm surface system, a warm ink system, and one accent. Nothing else. No blue for links, no green for success, no gray-scale neutral. The system's restraint is the point — every element that carries the accent color earns it.

### Neutral — Surface System

- **Con Paper** (`#f2ece0`, `oklch(93.5% 0.014 80)`): The page background. The primary canvas for all content. Warm card stock — slightly yellowed, as if it has been on a shelf. Never pure white.
- **Worn Tan** (`#e4dccf`, `oklch(88.5% 0.018 78)`): Sidebar background, filter panel, form fieldsets, table headers. One tier deeper than the page, providing structure without a sharp break.
- **Table Tint** (`#ece5d5`, `oklch(90.5% 0.016 79)`): Alternating table rows. Stays within the surface system — barely distinguishable, but enough to separate rows at a glance.
- **Row Hover** (`#dbd2c3`, `oklch(85.5% 0.020 77)`): Interactive row hover and selected state. A tangible step down from the surface — visible without being loud.

### Neutral — Ink System

- **Deep Ink** (`#2a201a`, `oklch(21% 0.018 52)`): Primary text, all body copy, event names, labels. Warm near-black — never pure `#000000`. The warmth is what places it on paper rather than a screen.
- **Worn Ink** (`#63503f`, `oklch(45% 0.022 54)`): Secondary text, metadata, muted labels, helper text. The color of text that has faded from many printings.
- **Faded Ink** (`#988a7a`, `oklch(62% 0.018 65)`): Placeholder text and disabled UI elements. Does not meet WCAG AA contrast for normal text — this is intentional and permitted under 1.4.3, which exempts inactive components.
- **Ruled Line** (`#c2b5a5`, `oklch(75% 0.016 72)`): Structural borders — inputs, table dividers, card edges. The color of a printed line.
- **Ghost Line** (`#d8d0c2`, `oklch(84% 0.012 75)`): Subtle separators between sections or between filter groups. Only visible when you look for it.

### Primary — Accent

- **Sienna** (`#954528`, `oklch(46% 0.14 40)`): The signature action color. Deep terracotta — the color of a wooden meeple, a painted board game token, a worn red-orange playing piece. Used on primary buttons, focus rings, active filter chips, active navigation states, and interactive affordances that need to be found immediately. Achieves 5.6:1 contrast against Con Paper.
- **Deep Sienna** (`#7c3a1e`, `oklch(38% 0.13 38)`): Accent hover state. The same color, pressed. Only appears as a state transition; never used as a static color.

### Named Rules

**The Three Roles Rule.** Surface, ink, accent — that is the complete palette. Never add a fourth role (a secondary accent, a semantic green for success, a info blue). Semantic states (error, warning, changelog entries) are expressed through `ink` and `accent` combination and typographic weight, not additional hues. The restraint is what makes the sienna mean something.

**The No Pure Black Rule.** No `#000000` or `#ffffff` anywhere in the system. Every neutral is tinted toward the warm orange-yellow axis (hue 50–80° in OKLCH). This keeps the system cohesive and analog-feeling at every tier.

## 3. Typography: Four Fonts, Four Jobs

**Display Font:** Cormorant Garamond (with Georgia, serif fallback)
**Body Font:** Source Sans 3 (with system-ui, sans-serif fallback)
**Catalog/Label Font:** Zilla Slab (with Georgia, serif fallback)
**Data Font:** Courier Prime (with Courier New, monospace fallback)

**Character:** The pairing is modeled on a high-quality game rulebook — the kind with a proper display face for the title and chapter openers, a slab serif for section headers and catalog entries, a readable humanist sans for all running prose, and a typewriter face for the codes, references, and the serial-number precision that nerds love. Four fonts is unusual in a product UI; the justification is that each one has a non-overlapping job. Never mix jobs.

All four fonts are available on Google Fonts as open source. Load in one request at the appropriate weights.

### Hierarchy

- **Display** (Cormorant Garamond, 700, `clamp(1.75rem, 4vw, 2.5rem)`, line-height 1.1, letter-spacing −0.01em): The app title "Gen Con Buddy" in the header and any hero-scale heading. Rare by design — the moment of character, not the working text. Use OpenType features: `kern`, `liga`, `onum`.

- **Headline** (Cormorant Garamond, 600, 1.5rem, line-height 1.25): Event names on the detail page. The primary H1 for a piece of content. One per screen at most.

- **Title** (Zilla Slab, 600, 0.8125rem, letter-spacing 0.06em, uppercase): Filter fieldset headers ("SEARCH", "DAYS", "PLAYERS"), table column headers, section labels in EventDetail ("THE EVENT", "PLAYERS", "LOGISTICS"). The catalog voice — organized, declarative, like a chapter heading in a program.

- **Body** (Source Sans 3, 400, 1rem, line-height 1.6): Event descriptions, long-form content, body copy. Max line length 68ch. Source Sans 3 is chosen specifically for legibility at this scale on warm paper backgrounds.

- **Label** (Zilla Slab, 400, 0.75rem, letter-spacing 0.05em, uppercase): Form field labels, filter control labels, metadata keys. Same family as Title but lighter weight — a supporting voice, not a leading one.

- **Code** (Courier Prime, 400, 0.875rem, line-height 1.5): Event IDs (e.g., RPG12345678), game system codes, timestamps, any value that should read as an official record or printed reference number. Use tabular numbers (`tnum`).

### Named Rules

**The Right Font for the Job Rule.** Cormorant for display character. Zilla Slab for catalog order. Source Sans 3 for long reads. Courier Prime for official records. Never substitute one for another's job — using Zilla Slab for body text reads as a rulebook, not an app. Using Source Sans for event codes reads as approximate, not precise.

**The Uppercase Threshold Rule.** Uppercase is only for Title and Label roles. Every other typographic role is sentence case or title case. Uppercase at body size reads as shouting; at 0.8125rem with appropriate tracking, it reads as print.

## 4. Elevation

Gen Con Buddy is flat by default. The reference aesthetic is print — board game rulebooks, event programs, catalog pages — and printed materials have no inherent elevation. Depth is communicated through tonal layering (the Con Paper → Worn Tan → Row Tint steps) and through Ruled Line borders, not through shadows.

Shadows appear only when an element is genuinely overlaid: popovers, dropdowns, modals — elements that exist in a layer above the page. Even then, the shadow uses the warm ink color at low opacity, not a generic cool gray.

### Shadow Vocabulary

- **Overlay lift** (`0 2px 8px rgba(42, 32, 26, 0.12)`): Column action popovers, toggletips, combobox dropdowns. The minimum shadow to read as floating.
- **Modal depth** (`0 8px 32px rgba(42, 32, 26, 0.20)`): Dialogs and full modal overlays. More depth to match the greater distance from the page.

### Named Rules

**The Print Is Flat Rule.** No decorative shadows on cards, rows, panels, or static UI elements. If it sits on the page, it has no shadow — it IS the page. Shadows appear only to answer a real spatial question: "is this above the content or on it?"

## 5. Components

### Buttons

Buttons in this system are slightly rounded but never pill-shaped (that's for filter chips). Their mass comes from color and weight, not from curvature.

- **Shape:** 2px radius (subtle) — barely rounded, like a game card corner rather than a UI bubble
- **Primary:** Sienna background (`#954528`), Con Paper text (`#f2ece0`), Zilla Slab 600 uppercase, 0.625rem × 1.25rem padding. 5.6:1 contrast. The single most-emphasized action on any surface.
- **Primary hover:** Deep Sienna background (`#7c3a1e`). 80ms ease transition on background-color only.
- **Secondary:** 1px Ruled Line border (`#c2b5a5`), transparent background, Deep Ink text (`#2a201a`). Used for secondary actions (e.g., "View on Gen Con").
- **Secondary hover:** Background shifts to Worn Tan (`#e4dccf`). Border shifts to Worn Ink (`#63503f`).
- **Ghost:** No border, no background. Worn Ink text (`#63503f`). Used for tertiary actions and inline controls (column visibility toggles, close buttons, "back" navigation).
- **Ghost hover:** Background shifts to Row Hover (`#dbd2c3`).
- **Focus-visible (all variants):** 2px solid Sienna ring, 2px offset. Consistent across the system — the focus ring always uses the accent.
- **Icon-only variant:** Square aspect ratio, ghost treatment. No label.

### Filter Chips (ActiveFilters)

Active filters are the one place pill shapes are correct — they're ephemeral, dismissible, read as tags, not buttons.

- **Inactive:** Worn Tan background, Worn Ink text, Label typography. Used as presentational tags where no remove action is needed.
- **Active/dismissible:** Same styling but with an inline remove (×) button. The × uses Faded Ink color, not Sienna — the chip itself draws the eye, not the dismiss.
- **Hover (dismissible):** Background shifts to Row Hover.
- **Focus-visible:** Same Sienna ring pattern as buttons.
- The ActiveFilters bar sits below the search toolbar as a horizontal scroll container when chips overflow.

### Inputs / Fields

- **Style:** 1px Ruled Line border (`#c2b5a5`), Con Paper background (`#f2ece0`), 2px radius, Body typography (Source Sans 3, 1rem). Padding: 0.5rem × 0.75rem.
- **Focus:** Border shifts from Ruled Line to Deep Ink (`#2a201a`). No glow, no color shift — just the border darkening. Clean and analog.
- **Error:** Border shifts to Sienna (`#954528`). Error message below in Worn Ink, Label size.
- **Disabled:** Background shifts to Worn Tan. Text shifts to Faded Ink. No interaction visual.
- **Range fields (min/max pairs):** Two inputs in a row with a centered "–" separator in Worn Ink.
- **Select:** Same border and background as inputs. Use native `<select>` with a custom chevron in Worn Ink.
- **Field labels:** Zilla Slab, 0.75rem, Label role, uppercase, letter-spacing 0.05em. Always above the input, never inline.

### Event Table

The EventTable is the heart of the product — where users spend most of their time. It should feel like a printed event catalog, not a spreadsheet.

- **Header row:** Worn Tan background (`#e4dccf`), Deep Ink text, Title typography (Zilla Slab 600 uppercase). 1px Ghost Line border below.
- **Default rows:** Con Paper background.
- **Alternating rows:** Table Tint background (`#ece5d5`). The alternation is subtle — same warm family, not a visible stripe pattern.
- **Hover:** Row Hover (`#dbd2c3`). 80ms ease transition.
- **Column resize handles:** Ruled Line color, visible on header hover.
- **Sortable column indicator:** Sienna accent for the active sort direction arrow. Inactive sort arrows in Faded Ink.
- **Cell typography:** Body for descriptions; Code for event IDs and game system codes; Label for event type abbreviations.

### Navigation

- **Structure:** `<header>` with role="banner". Horizontal layout. Left: app title at Display scale. Right: nav links.
- **App title:** "Gen Con Buddy" in Cormorant Garamond 700, Display scale. Tagline below in Courier Prime 400, 0.8125rem, Worn Ink — "your guide to the best four days in gaming."
- **Nav links:** Zilla Slab 600, Title scale (0.8125rem), uppercase, letter-spacing 0.06em. Deep Ink color by default.
- **Active nav link:** Sienna color. No underline, no background — color change only.
- **Hover:** Worn Ink color (lighter than Deep Ink). 80ms ease.
- **Mobile:** Nav collapses — filter toggle button takes over as the primary control.
- **Border:** 1px Ghost Line below the header.

### Signature Component: EventTypeSelect

The EventTypeSelect combobox is a signature component — a multi-select with inline filtering for event types (up to 50+ categories). It must feel like using a card catalog index, not a modern multi-select widget.

- **Trigger:** Secondary button style with the current selection count as a badge in Courier Prime.
- **Dropdown list:** Worn Tan background, 1px Ruled Line border, 4px radius (card), Overlay lift shadow.
- **List items:** Body typography, 0.5rem vertical padding. Checkmark in Sienna when selected.
- **Filter input inside dropdown:** Ghost input treatment (no border, no background, body typography) at the top of the list.
- **Selected items in trigger:** Show "N types" in Label typography when multiple selected.

## 6. Do's and Don'ts

### Do:

- **Do** use `#f2ece0` as the page background everywhere. If something reads as white, it's wrong.
- **Do** use Sienna (`#954528`) only for primary interactive affordances — the primary button, focus rings, active states, active nav. Its rarity is what makes it readable as "action."
- **Do** use Zilla Slab for every UI label, filter section header, and table column header — the slab voice is what ties the catalog aesthetic together.
- **Do** use Courier Prime for any value that is a code, ID, reference number, or timestamp. Precision requires precision type.
- **Do** use the overlay lift shadow (`0 2px 8px rgba(42,32,26,0.12)`) for popovers and dropdowns, and nothing else.
- **Do** keep button radius at 2px. The system's analog credibility depends on edges that feel cut, not molded.
- **Do** set max line length to 68ch on body text (event descriptions, detail page copy).
- **Do** use uppercase with `letter-spacing: 0.06em` for every Title and Label instance. Uppercase without tracking at this size reads as compressed, not structured.
- **Do** respect `prefers-reduced-motion`. All transitions in this system are 80ms or less and state-change only — they should degrade gracefully to instant.

### Don't:

- **Don't** use generic SaaS aesthetics: no gray-on-white, no rounded card shadows, no blue accent, no san-serif-everything. If it looks like a project management tool, something has gone wrong.
- **Don't** use corporate event app styling (Eventbrite, conference app templates). Functional neutrality is not this product's identity. This app is made by a fan, for fans.
- **Don't** use digital retro or pixel-art styling: no chiptune-aesthetic fonts, no neon-on-dark, no pixel grids. The reference is analog tabletop, not a Game Boy screen.
- **Don't** use fantasy or medieval theming: no parchment texture imagery, no Gothic letterforms, no sword-and-sorcery decoration. Gen Con spans every genre; RPG aesthetics represent a fraction of it.
- **Don't** use `#000000` or `#ffffff` anywhere. Both are wrong: too stark, no warmth, wrong medium.
- **Don't** add a fourth color role. Surface, ink, and sienna are complete. If you feel the urge to add a semantic green or a secondary blue, express the semantic distinction through typographic weight and sienna instead.
- **Don't** use pill-shaped buttons. Pills are for filter chips — ephemeral, dismissible. A button that persists should have a corner.
- **Don't** use `border-left` as a colored accent stripe. Not for callouts, not for changelog entries, not for event detail sections. Use background tints or full borders.
- **Don't** use Cormorant Garamond below 1.375rem. It is a display face; at small sizes it loses its character and gains optical weight problems. Use Zilla Slab or Source Sans 3 at those scales.
- **Don't** use Source Sans 3 for UI section headers or labels. That's Zilla Slab's job. Mixing the jobs produces a muddled hierarchy that reads as undesigned.
