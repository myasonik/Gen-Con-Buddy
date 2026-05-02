# Filter Pill Icons — Design Spec

**Date:** 2026-05-02

## Summary

Add game-themed icons from game-icons.net to active filter pills. Each pill gets a small decorative icon rendered before its label text. Event-type pills each get a type-specific icon; general filter pills get a semantically appropriate icon where one clearly fits.

## Icon Assignments

### Event Type Pills (one specific icon per code)

| Code | Label                     | Icon                       | Artist     |
| ---- | ------------------------- | -------------------------- | ---------- |
| ANI  | Anime Activities          | `ninja-mask`               | lorc       |
| BGM  | Board Game                | `rolling-dices`            | delapouite |
| CGM  | Non-Collectible Card Game | `poker-hand`               | lorc       |
| EGM  | Electronic Games          | `gamepad`                  | delapouite |
| ENT  | Entertainment Events      | `drama-masks`              | lorc       |
| FLM  | Film Fest                 | `clapperboard`             | delapouite |
| HMN  | Historical Miniatures     | `cannon`                   | lorc       |
| KID  | Kids Activities           | `spinning-top`             | skoll      |
| LRP  | LARP                      | `crossed-swords`           | lorc       |
| MHE  | Miniature Hobby Events    | `paint-brush`              | delapouite |
| NMN  | Non-Historical Miniatures | `dragon-head`              | lorc       |
| RPG  | Role Playing Game         | `dice-twenty-faces-twenty` | delapouite |
| SEM  | Seminar                   | `public-speaker`           | delapouite |
| SPA  | Supplemental Activities   | `party-popper`             | delapouite |
| TCG  | Tradable Card Game        | `card-exchange`            | delapouite |
| TDA  | True Dungeon Adventures   | `dungeon-gate`             | delapouite |
| TRD  | Trade Day Event           | `trade`                    | lorc       |
| WKS  | Workshop                  | `anvil`                    | lorc       |
| ZED  | Isle of Misfit Events     | `jester-hat`               | delapouite |

All icons are CC BY 3.0 from game-icons.net.

### General Filter Pills

| Filter key(s)                                                        | Label                       | Icon                            | Artist     |
| -------------------------------------------------------------------- | --------------------------- | ------------------------------- | ---------- |
| `filter`                                                             | Search                      | `magnifying-glass`              | lorc       |
| `days` (per day chip)                                                | Wed / Thu / Fri / Sat / Sun | `calendar`                      | delapouite |
| `timeRange`                                                          | time range chip             | `hourglass`                     | lorc       |
| `duration`                                                           | Duration                    | `hourglass`                     | lorc       |
| `minimumPlayTime`                                                    | Min play time               | `hourglass`                     | lorc       |
| `minPlayers`, `maxPlayers`                                           | Min/max players             | Meeple _(existing in codebase)_ | delapouite |
| `cost`                                                               | Cost                        | `coins`                         | delapouite |
| `ticketsAvailable`                                                   | Tickets                     | `ticket`                        | delapouite |
| `attendeeRegistration`                                               | Registration                | `ticket`                        | delapouite |
| `tournament`                                                         | Tournament                  | `trophy`                        | lorc       |
| `ageRequired`                                                        | Age                         | `ages`                          | delapouite |
| `experienceRequired`                                                 | Exp                         | `skills`                        | delapouite |
| `location`, `roomName`                                               | Location / Room             | `position-marker`               | delapouite |
| `specialCategory`                                                    | Category                    | `beveled-star`                  | lorc       |
| `lastModified`                                                       | Modified                    | `calendar`                      | delapouite |
| `gameSystem`, `rulesEdition`                                         | System / Rules              | `rule-book`                     | delapouite |
| `materialsRequired`, `materialsProvided`, `materialsRequiredDetails` | Materials \*                | `backpack`                      | delapouite |

### Skipped (no clear thematic match)

`gameId`, `title`, `group`, `gmNames`, `shortDescription`, `longDescription`, `website`, `email`, `tableNumber`, `roundNumber`, `totalRounds`

## Architecture

### `ActiveFilter` interface

Add an optional `icon` field:

```typescript
export interface ActiveFilter {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  remove: (prev: SearchParams) => SearchParams;
}
```

### `getActiveFilters.ts`

- Add optional `icon` field to `PlainDef`, `EnumDef`, `RangeDef`, `DateRangeDef`, `CostDef`, and `MultiDef` type definitions.
- Populate `icon` on each relevant entry in `FILTER_DEFS`.
- Add a new `EVENT_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>>` map covering all 19 event type codes. Used when processing `multi` entries for `eventType`.
- The `timeRange` special case (built before the FILTER_DEFS loop) also gets `icon: Hourglass`.

### New icon files (`src/ui/icons/`)

One file per new icon, following the existing `createIcon()` pattern with attribution comment:

```typescript
// game-icons.net — "icon-name" by artist (CC BY 3.0)
export const IconName = createIcon("IconName", "0 0 512 512", <path d="..." />);
```

SVG paths are fetched from `https://game-icons.net/icons/ffffff/000000/1x1/{artist}/{name}.svg`.

New files needed (31 total):
`NinjaMask`, `RollingDices`, `PokerHand`, `Gamepad`, `DramaMasks`, `Clapperboard`, `Cannon`, `SpinningTop`, `CrossedSwords`, `PaintBrush`, `DragonHead`, `DiceTwentyFacesTwenty`, `PublicSpeaker`, `PartyPopper`, `CardExchange`, `DungeonGate`, `Trade`, `Anvil`, `JesterHat`, `MagnifyingGlass`, `Calendar`, `Hourglass`, `Coins`, `Ticket`, `Trophy`, `Ages`, `Skills`, `PositionMarker`, `BeveledStar`, `RuleBook`, `Backpack`

The existing `Meeple` component (already in codebase) is reused for min/max players.

### `ActiveFilters.tsx`

Render icon before label text:

```tsx
<Button variant="ghost" className={styles.chip} onClick={() => onRemove(filter)}>
  {filter.icon && <filter.icon size={12} />}
  {filter.label}
  <span aria-hidden="true">×</span>
</Button>
```

Icons are decorative — the label already describes the filter — so `aria-hidden="true"` is applied automatically by `createIcon()`.

### CSS

No changes needed. `.chip` already has `display: inline-flex; align-items: center; gap: var(--space-1)`.

## Testing

- `getActiveFilters.test.ts`: Assert that representative filter types return the correct `icon` component reference (e.g., `eventType: "RPG"` → `DiceTwentyFacesTwenty`, `tournament: "Yes"` → `Trophy`, `days: "fri"` → `Calendar`). Assert that skipped filters return `icon: undefined`.
- `ActiveFilters.test.tsx`: Update existing render tests to confirm icons render; add a case verifying no icon renders for a filter without one.
- No new snapshot tests — icon rendering is covered by behavioral assertions.
