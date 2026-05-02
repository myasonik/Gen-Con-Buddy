# Product

## Register

product

## Users

Gen Con attendees — gamers, board game enthusiasts, LARP players, miniatures hobbyists — planning their four-day convention schedule in Indianapolis. They arrive with a list of must-sees and a lot of "I'll figure the rest out later." The app is their primary research tool in the weeks before the con: they search repeatedly, filter obsessively, and cross-reference across sessions. Their mental model is closer to flipping through a dog-eared convention program than browsing a SaaS dashboard.

## Product Purpose

Gen Con Buddy is a fast, deeply filterable event search tool built specifically for Gen Con. Users search across 30+ criteria — event type, time slot, location, cost, player counts, experience level, game system — and navigate from results to event detail and back. The changelog view lets them track last-minute event changes. Success means a user can walk into the con knowing exactly where they're going and when.

## Brand Personality

Friendly, nerdy, reliable. The interface speaks gamer-to-gamer: it knows the domain, uses the vocabulary, and doesn't oversimplify. But it's warm and approachable, not elitist. It's the knowledgeable friend at the gaming table who always has the rulebook memorized but never makes you feel bad for forgetting.

## Anti-references

- **Generic SaaS:** The rounded-card, gray-on-white, blue-accent look shared by Notion, Jira, and every B2B productivity tool. This is a gaming tool, not a project tracker.
- **Corporate event apps:** Eventbrite, conference scheduling apps — technically functional but utterly soulless. Zero personality, zero affinity for the subject matter.
- **Digital retro / pixel-art:** Chiptune aesthetic, pixelated fonts, neon-on-black arcade styling. Wrong era, wrong medium. The reference is analog tabletop, not a Game Boy.
- **Fantasy RPG theming:** Parchment textures, Gothic fonts, sword-and-sorcery imagery. Gen Con spans every genre; leaning medieval would alienate half the audience.

## Design Principles

1. **Analog warmth, not digital sleekness.** Draw from the tactile feel of board game components — cardboard, linen, offset print, meeples — not from screen-native tech aesthetics. Warmth comes from palette and weight, not decoration.

2. **Nerdy confidence.** Use domain vocabulary without apology. Event type abbreviations, game system names, Gen Con terminology are features, not bugs. The interface assumes the user knows what they're doing.

3. **Reliable above all else.** A convention schedule is high-stakes — wrong room, missed session, wasted badge money. Every interaction should feel dependable: predictable hierarchy, clear feedback, zero ambiguity about state.

4. **Character without costume.** Personality lives in type choices, color warmth, and spacing rhythm — not in excessive iconography, theme decoration, or "fun" copy that gets in the way. One well-placed meeple does more than a page of playful microcopy.

5. **Discovery feels light.** Thirty-plus filter options could feel like homework. Progressive disclosure, smart defaults, and clear affordances keep search feeling effortless — like leafing through a well-organized catalog, not filling out a form.

## Accessibility & Inclusion

WCAG 2.2 AA compliance. Known considerations: the existing codebase enforces accessible announcement patterns via a custom `announce()` utility (no inline `aria-live` regions). Reduced-motion support should be respected for all animations. Color contrast must meet AA ratios in both light and any future dark-mode variants.
