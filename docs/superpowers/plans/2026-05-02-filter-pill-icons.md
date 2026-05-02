# Filter Pill Icons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add game-themed icons from game-icons.net to active filter pills, with 19 type-specific icons for event-type chips and semantic icons for general filter chips.

**Architecture:** Add an optional `icon` field to the `ActiveFilter` interface; `getActiveFilters()` assigns the component; `ActiveFilters` renders it before the label. All icons follow the existing `createIcon()` pattern in `src/ui/icons/`. Event-type codes map to icons via a new `EVENT_TYPE_ICONS` record in `src/ui/icons/eventTypeIcons.ts`.

**Tech Stack:** React, TypeScript, Vitest, CSS Modules, game-icons.net (CC BY 3.0)

---

## File Map

**New files — icon components (`src/ui/icons/`):**
lorc: `NinjaMask.tsx`, `PokerHand.tsx`, `DramaMasks.tsx`, `Cannon.tsx`, `CrossedSwords.tsx`, `DragonHead.tsx`, `Hourglass.tsx`, `Trophy.tsx`, `BeveledStar.tsx`, `MagnifyingGlass.tsx`, `Trade.tsx`
delapouite: `RollingDices.tsx`, `Gamepad.tsx`, `Clapperboard.tsx`, `PaintBrush.tsx`, `DiceTwentyFacesTwenty.tsx`, `PublicSpeaker.tsx`, `PartyPopper.tsx`, `CardExchange.tsx`, `DungeonGate.tsx`, `Anvil.tsx`, `JesterHat.tsx`, `Calendar.tsx`, `Coins.tsx`, `Ticket.tsx`, `Ages.tsx`, `Skills.tsx`, `PositionMarker.tsx`, `RuleBook.tsx`, `Backpack.tsx`
skoll: `SpinningTop.tsx`

**New file:** `src/ui/icons/eventTypeIcons.ts` — maps event-type codes to icon components

**Modified files:**

- `src/ui/ActiveFilters/getActiveFilters.ts` — add `icon` to `ActiveFilter` + FilterDef types; assign icons
- `src/ui/ActiveFilters/ActiveFilters.tsx` — render icon before label
- `src/ui/ActiveFilters/getActiveFilters.test.ts` — icon assertions

---

## How to fetch SVG path data

Every game-icons.net icon SVG lives at:

```
https://game-icons.net/icons/ffffff/000000/1x1/{artist}/{icon-name}.svg
```

To extract the path data:

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/trophy.svg"
```

The response is a small SVG file. Find the `<path>` element and copy its `d="..."` value. If the element has `fill-rule="evenodd"`, add `fillRule="evenodd"` to the JSX. All game-icons.net SVGs use `viewBox="0 0 512 512"`.

---

## Task 1: Extend `ActiveFilter` interface and FilterDef types

**Files:**

- Modify: `src/ui/ActiveFilters/getActiveFilters.ts`

- [ ] **Step 1: Add `icon` to `ActiveFilter` interface**

In `getActiveFilters.ts`, update the `ActiveFilter` interface (lines 4–8):

```typescript
import type React from "react";

export interface ActiveFilter {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  remove: (prev: SearchParams) => SearchParams;
}
```

- [ ] **Step 2: Add `icon?` to each FilterDef type**

Update the six FilterDef interfaces (lines 80–111). Add `icon?: React.ComponentType<{ size?: number }>` to `PlainDef`, `EnumDef`, `RangeDef`, `DateRangeDef`, and `CostDef`. For `MultiDef`, add both `icon?` (shared icon for all values, used by `days`) and `iconMap?` (per-code icon, used by `eventType`):

```typescript
interface PlainDef {
  type: "plain";
  key: keyof SearchParams;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
}
interface EnumDef {
  type: "enum";
  key: keyof SearchParams;
  label: string;
  map: Record<string, string>;
  icon?: React.ComponentType<{ size?: number }>;
}
interface RangeDef {
  type: "range";
  key: keyof SearchParams;
  label: string;
  suffix?: string;
  icon?: React.ComponentType<{ size?: number }>;
}
interface DateRangeDef {
  type: "dateRange";
  key: keyof SearchParams;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
}
interface CostDef {
  type: "cost";
  key: "cost";
  icon?: React.ComponentType<{ size?: number }>;
}
interface MultiDef {
  type: "multi";
  key: keyof SearchParams;
  map: Record<string, string>;
  prefix: string;
  icon?: React.ComponentType<{ size?: number }>;
  iconMap?: Record<string, React.ComponentType<{ size?: number }>>;
}
```

- [ ] **Step 3: Propagate `icon` in the `getActiveFilters` loop**

In the `getActiveFilters` function, update each branch to pass `icon: def.icon` through to the pushed `ActiveFilter`. For the `multi` branch, resolve the chip's icon from `def.iconMap?.[code] ?? def.icon`:

```typescript
// plain branch
filters.push({ id: def.key, label: `${def.label}: ${val}`, icon: def.icon, remove: removeKey(def.key) });

// enum branch
filters.push({ id: def.key, label: `${def.label}: ${display}`, icon: def.icon, remove: removeKey(def.key) });

// range branch
filters.push({ id: def.key, label: fmtRange(val as string, `${def.label}: `, def.suffix), icon: def.icon, remove: removeKey(def.key) });

// dateRange branch
filters.push({ id: def.key, label: fmtDateRange(val as string, `${def.label}: `), icon: def.icon, remove: removeKey(def.key) });

// cost branch
filters.push({ id: def.key, label: fmtCostRange(val as string), icon: def.icon, remove: removeKey(def.key) });

// multi branch — add chipIcon resolution before the filters.push
const chipIcon = def.iconMap ? def.iconMap[code] : def.icon;
filters.push({
  id: `${def.prefix}:${code}`,
  label,
  icon: chipIcon,
  remove: ..., // keep existing remove logic unchanged
});
```

Also update the `timeRange` special case (before the loop) to include `icon` — leave it undefined for now; it'll be assigned in Task 7 once `Hourglass` exists.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc -b --noEmit
```

Expected: no new errors (existing SearchForm.tsx error is pre-existing and unrelated).

- [ ] **Step 5: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts
git commit -m "feat(filter-icons): extend ActiveFilter interface with optional icon field"
```

---

## Task 2: Write failing icon-assignment tests

**Files:**

- Modify: `src/ui/ActiveFilters/getActiveFilters.test.ts`

- [ ] **Step 1: Add icon assertion tests**

Append these tests to `getActiveFilters.test.ts`. They will fail until the icon components exist and are wired in:

```typescript
// ── Icon assertions ────────────────────────────────────────────────────────

test("eventType:RPG chip has DiceTwentyFacesTwenty icon", () => {
  const [chip] = getActiveFilters({ eventType: "RPG" });
  const { DiceTwentyFacesTwenty } = await import("../icons/DiceTwentyFacesTwenty");
  expect(chip.icon).toBe(DiceTwentyFacesTwenty);
});

test("eventType:BGM chip has RollingDices icon", () => {
  const [chip] = getActiveFilters({ eventType: "BGM" });
  const { RollingDices } = await import("../icons/RollingDices");
  expect(chip.icon).toBe(RollingDices);
});

test("days chip has Calendar icon", () => {
  const [chip] = getActiveFilters({ days: "fri" });
  const { Calendar } = await import("../icons/Calendar");
  expect(chip.icon).toBe(Calendar);
});

test("timeRange chip has Hourglass icon", () => {
  const [chip] = getActiveFilters({ timeStart: "09:00" });
  const { Hourglass } = await import("../icons/Hourglass");
  expect(chip.icon).toBe(Hourglass);
});

test("duration chip has Hourglass icon", () => {
  const [chip] = getActiveFilters({ duration: "[1,4]" });
  const { Hourglass } = await import("../icons/Hourglass");
  expect(chip.icon).toBe(Hourglass);
});

test("tournament chip has Trophy icon", () => {
  const [chip] = getActiveFilters({ tournament: "Yes" });
  const { Trophy } = await import("../icons/Trophy");
  expect(chip.icon).toBe(Trophy);
});

test("cost chip has Coins icon", () => {
  const [chip] = getActiveFilters({ cost: "[0,5]" });
  const { Coins } = await import("../icons/Coins");
  expect(chip.icon).toBe(Coins);
});

test("filter (search) chip has MagnifyingGlass icon", () => {
  const [chip] = getActiveFilters({ filter: "dragon" });
  const { MagnifyingGlass } = await import("../icons/MagnifyingGlass");
  expect(chip.icon).toBe(MagnifyingGlass);
});

test("title chip has no icon", () => {
  const [chip] = getActiveFilters({ title: "dragon" });
  expect(chip.icon).toBeUndefined();
});

test("gmNames chip has no icon", () => {
  const [chip] = getActiveFilters({ gmNames: "Alice" });
  expect(chip.icon).toBeUndefined();
});
```

> **Note:** The `await import(...)` pattern is used because these tests run before the icon files exist. Once the icon files exist (Task 3+), vitest will resolve the imports synchronously in the test environment. If your vitest config doesn't support top-level await in test files, use static imports at the top of the test file instead — the import will fail until the file exists, giving you the expected red state.

**Recommended approach** — use static imports at the top of the file (simpler, shows red state as "module not found"):

```typescript
import { DiceTwentyFacesTwenty } from "../icons/DiceTwentyFacesTwenty";
import { RollingDices } from "../icons/RollingDices";
import { Calendar } from "../icons/Calendar";
import { Hourglass } from "../icons/Hourglass";
import { Trophy } from "../icons/Trophy";
import { Coins } from "../icons/Coins";
import { MagnifyingGlass } from "../icons/MagnifyingGlass";
```

Then the tests are simply:

```typescript
test("eventType:RPG chip has DiceTwentyFacesTwenty icon", () => {
  const [chip] = getActiveFilters({ eventType: "RPG" });
  expect(chip.icon).toBe(DiceTwentyFacesTwenty);
});
// etc.
```

- [ ] **Step 2: Run tests to confirm red state**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: new icon tests fail with "Cannot find module '../icons/DiceTwentyFacesTwenty'" or similar.

---

## Task 3: Create lorc icon components (11 files)

**Files:**

- Create: `src/ui/icons/NinjaMask.tsx`
- Create: `src/ui/icons/PokerHand.tsx`
- Create: `src/ui/icons/DramaMasks.tsx`
- Create: `src/ui/icons/Cannon.tsx`
- Create: `src/ui/icons/CrossedSwords.tsx`
- Create: `src/ui/icons/DragonHead.tsx`
- Create: `src/ui/icons/Hourglass.tsx`
- Create: `src/ui/icons/Trophy.tsx`
- Create: `src/ui/icons/BeveledStar.tsx`
- Create: `src/ui/icons/MagnifyingGlass.tsx`
- Create: `src/ui/icons/Trade.tsx`

All lorc icons live at `https://game-icons.net/icons/ffffff/000000/1x1/lorc/{name}.svg`.

The component template is identical for all icons (replace `DISPLAY_NAME`, `ICON_SLUG`, and path content):

```typescript
import { createIcon } from "./createIcon";

// game-icons.net — "{icon-slug}" by lorc (CC BY 3.0)
export const DISPLAY_NAME = createIcon(
  "DISPLAY_NAME",
  "0 0 512 512",
  <path d="…path data from SVG…" />,
);
```

If the fetched SVG `<path>` element includes `fill-rule="evenodd"`, write it as `fillRule="evenodd"` in the JSX.

- [ ] **Step 1: Fetch and create NinjaMask**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/ninja-mask.svg"
# copy the d="..." value from <path>
```

Create `src/ui/icons/NinjaMask.tsx`:

```typescript
import { createIcon } from "./createIcon";

// game-icons.net — "ninja-mask" by lorc (CC BY 3.0)
export const NinjaMask = createIcon(
  "NinjaMask",
  "0 0 512 512",
  <path d="…" />, // paste d value from curl output
);
```

- [ ] **Step 2: Fetch and create PokerHand**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/poker-hand.svg"
```

Create `src/ui/icons/PokerHand.tsx` (same pattern, display name `PokerHand`, slug `poker-hand`).

- [ ] **Step 3: Fetch and create DramaMasks**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/drama-masks.svg"
```

Create `src/ui/icons/DramaMasks.tsx` (slug `drama-masks`).

- [ ] **Step 4: Fetch and create Cannon**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/cannon.svg"
```

Create `src/ui/icons/Cannon.tsx` (slug `cannon`).

- [ ] **Step 5: Fetch and create CrossedSwords**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/crossed-swords.svg"
```

Create `src/ui/icons/CrossedSwords.tsx` (slug `crossed-swords`).

- [ ] **Step 6: Fetch and create DragonHead**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/dragon-head.svg"
```

Create `src/ui/icons/DragonHead.tsx` (slug `dragon-head`).

- [ ] **Step 7: Fetch and create Hourglass**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/hourglass.svg"
```

Create `src/ui/icons/Hourglass.tsx` (slug `hourglass`).

- [ ] **Step 8: Fetch and create Trophy**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/trophy.svg"
```

Create `src/ui/icons/Trophy.tsx` (slug `trophy`).

- [ ] **Step 9: Fetch and create BeveledStar**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/beveled-star.svg"
```

Create `src/ui/icons/BeveledStar.tsx` (slug `beveled-star`).

- [ ] **Step 10: Fetch and create MagnifyingGlass**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/magnifying-glass.svg"
```

Create `src/ui/icons/MagnifyingGlass.tsx` (slug `magnifying-glass`).

- [ ] **Step 11: Fetch and create Trade**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/lorc/trade.svg"
```

Create `src/ui/icons/Trade.tsx` (slug `trade`).

- [ ] **Step 12: Commit**

```bash
git add src/ui/icons/NinjaMask.tsx src/ui/icons/PokerHand.tsx src/ui/icons/DramaMasks.tsx \
  src/ui/icons/Cannon.tsx src/ui/icons/CrossedSwords.tsx src/ui/icons/DragonHead.tsx \
  src/ui/icons/Hourglass.tsx src/ui/icons/Trophy.tsx src/ui/icons/BeveledStar.tsx \
  src/ui/icons/MagnifyingGlass.tsx src/ui/icons/Trade.tsx
git commit -m "feat(icons): add lorc icon components for filter pills"
```

---

## Task 4: Create delapouite icon components (19 files)

**Files:**

- Create: `src/ui/icons/RollingDices.tsx`
- Create: `src/ui/icons/Gamepad.tsx`
- Create: `src/ui/icons/Clapperboard.tsx`
- Create: `src/ui/icons/PaintBrush.tsx`
- Create: `src/ui/icons/DiceTwentyFacesTwenty.tsx`
- Create: `src/ui/icons/PublicSpeaker.tsx`
- Create: `src/ui/icons/PartyPopper.tsx`
- Create: `src/ui/icons/CardExchange.tsx`
- Create: `src/ui/icons/DungeonGate.tsx`
- Create: `src/ui/icons/Anvil.tsx` (note: `Anvil` from delapouite is at `lorc/anvil` — see step below)
- Create: `src/ui/icons/JesterHat.tsx`
- Create: `src/ui/icons/Calendar.tsx`
- Create: `src/ui/icons/Coins.tsx`
- Create: `src/ui/icons/Ticket.tsx`
- Create: `src/ui/icons/Ages.tsx`
- Create: `src/ui/icons/Skills.tsx`
- Create: `src/ui/icons/PositionMarker.tsx`
- Create: `src/ui/icons/RuleBook.tsx`
- Create: `src/ui/icons/Backpack.tsx`

All delapouite icons: `https://game-icons.net/icons/ffffff/000000/1x1/delapouite/{name}.svg`

Use the same component template as Task 3 (replace artist attribution with `delapouite`).

- [ ] **Step 1: Fetch and create RollingDices** (slug `rolling-dices`, artist delapouite)
- [ ] **Step 2: Fetch and create Gamepad** (slug `gamepad`, artist delapouite)
- [ ] **Step 3: Fetch and create Clapperboard** (slug `clapperboard`, artist delapouite)
- [ ] **Step 4: Fetch and create PaintBrush** (slug `paint-brush`, artist delapouite)
- [ ] **Step 5: Fetch and create DiceTwentyFacesTwenty** (slug `dice-twenty-faces-twenty`, artist delapouite)
- [ ] **Step 6: Fetch and create PublicSpeaker** (slug `public-speaker`, artist delapouite)
- [ ] **Step 7: Fetch and create PartyPopper** (slug `party-popper`, artist delapouite)
- [ ] **Step 8: Fetch and create CardExchange** (slug `card-exchange`, artist delapouite)
- [ ] **Step 9: Fetch and create DungeonGate** (slug `dungeon-gate`, artist delapouite)
- [ ] **Step 10: Fetch and create Anvil**

> **Note:** `anvil` is by **lorc**, not delapouite. Use `https://game-icons.net/icons/ffffff/000000/1x1/lorc/anvil.svg` and attribute to lorc.

Create `src/ui/icons/Anvil.tsx`:

```typescript
import { createIcon } from "./createIcon";

// game-icons.net — "anvil" by lorc (CC BY 3.0)
export const Anvil = createIcon(
  "Anvil",
  "0 0 512 512",
  <path d="…" />,
);
```

- [ ] **Step 11: Fetch and create JesterHat** (slug `jester-hat`, artist delapouite)
- [ ] **Step 12: Fetch and create Calendar** (slug `calendar`, artist delapouite)
- [ ] **Step 13: Fetch and create Coins** (slug `coins`, artist delapouite)
- [ ] **Step 14: Fetch and create Ticket** (slug `ticket`, artist delapouite)
- [ ] **Step 15: Fetch and create Ages** (slug `ages`, artist delapouite)
- [ ] **Step 16: Fetch and create Skills** (slug `skills`, artist delapouite)
- [ ] **Step 17: Fetch and create PositionMarker** (slug `position-marker`, artist delapouite)
- [ ] **Step 18: Fetch and create RuleBook** (slug `rule-book`, artist delapouite)
- [ ] **Step 19: Fetch and create Backpack** (slug `backpack`, artist delapouite)

- [ ] **Step 20: Commit**

```bash
git add src/ui/icons/RollingDices.tsx src/ui/icons/Gamepad.tsx src/ui/icons/Clapperboard.tsx \
  src/ui/icons/PaintBrush.tsx src/ui/icons/DiceTwentyFacesTwenty.tsx src/ui/icons/PublicSpeaker.tsx \
  src/ui/icons/PartyPopper.tsx src/ui/icons/CardExchange.tsx src/ui/icons/DungeonGate.tsx \
  src/ui/icons/Anvil.tsx src/ui/icons/JesterHat.tsx src/ui/icons/Calendar.tsx \
  src/ui/icons/Coins.tsx src/ui/icons/Ticket.tsx src/ui/icons/Ages.tsx \
  src/ui/icons/Skills.tsx src/ui/icons/PositionMarker.tsx src/ui/icons/RuleBook.tsx \
  src/ui/icons/Backpack.tsx
git commit -m "feat(icons): add delapouite icon components for filter pills"
```

---

## Task 5: Create SpinningTop (skoll)

**Files:**

- Create: `src/ui/icons/SpinningTop.tsx`

- [ ] **Step 1: Fetch and create SpinningTop**

```bash
curl -s "https://game-icons.net/icons/ffffff/000000/1x1/skoll/spinning-top.svg"
```

Create `src/ui/icons/SpinningTop.tsx`:

```typescript
import { createIcon } from "./createIcon";

// game-icons.net — "spinning-top" by skoll (CC BY 3.0)
export const SpinningTop = createIcon(
  "SpinningTop",
  "0 0 512 512",
  <path d="…" />,
);
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/icons/SpinningTop.tsx
git commit -m "feat(icons): add SpinningTop icon for KID event type"
```

---

## Task 6: Create the event-type icon map

**Files:**

- Create: `src/ui/icons/eventTypeIcons.ts`

- [ ] **Step 1: Create `eventTypeIcons.ts`**

```typescript
import type React from "react";
import { NinjaMask } from "./NinjaMask";
import { RollingDices } from "./RollingDices";
import { PokerHand } from "./PokerHand";
import { Gamepad } from "./Gamepad";
import { DramaMasks } from "./DramaMasks";
import { Clapperboard } from "./Clapperboard";
import { Cannon } from "./Cannon";
import { SpinningTop } from "./SpinningTop";
import { CrossedSwords } from "./CrossedSwords";
import { PaintBrush } from "./PaintBrush";
import { DragonHead } from "./DragonHead";
import { DiceTwentyFacesTwenty } from "./DiceTwentyFacesTwenty";
import { PublicSpeaker } from "./PublicSpeaker";
import { PartyPopper } from "./PartyPopper";
import { CardExchange } from "./CardExchange";
import { DungeonGate } from "./DungeonGate";
import { Trade } from "./Trade";
import { Anvil } from "./Anvil";
import { JesterHat } from "./JesterHat";

export const EVENT_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  ANI: NinjaMask,
  BGM: RollingDices,
  CGM: PokerHand,
  EGM: Gamepad,
  ENT: DramaMasks,
  FLM: Clapperboard,
  HMN: Cannon,
  KID: SpinningTop,
  LRP: CrossedSwords,
  MHE: PaintBrush,
  NMN: DragonHead,
  RPG: DiceTwentyFacesTwenty,
  SEM: PublicSpeaker,
  SPA: PartyPopper,
  TCG: CardExchange,
  TDA: DungeonGate,
  TRD: Trade,
  WKS: Anvil,
  ZED: JesterHat,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/icons/eventTypeIcons.ts
git commit -m "feat(icons): add EVENT_TYPE_ICONS map for event-type filter pills"
```

---

## Task 7: Wire icons into `getActiveFilters`

**Files:**

- Modify: `src/ui/ActiveFilters/getActiveFilters.ts`

- [ ] **Step 1: Add imports at the top of `getActiveFilters.ts`**

Add after the existing imports:

```typescript
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import { MagnifyingGlass } from "../icons/MagnifyingGlass";
import { Calendar } from "../icons/Calendar";
import { Hourglass } from "../icons/Hourglass";
import { Meeple } from "../icons/Meeple";
import { Coins } from "../icons/Coins";
import { Ticket } from "../icons/Ticket";
import { Trophy } from "../icons/Trophy";
import { Ages } from "../icons/Ages";
import { Skills } from "../icons/Skills";
import { PositionMarker } from "../icons/PositionMarker";
import { BeveledStar } from "../icons/BeveledStar";
import { RuleBook } from "../icons/RuleBook";
import { Backpack } from "../icons/Backpack";
```

- [ ] **Step 2: Assign icons in `FILTER_DEFS`**

Update the `FILTER_DEFS` array to add `icon` (and `iconMap` for `eventType`). Only show the entries that change — leave all others untouched:

```typescript
const FILTER_DEFS: FilterDef[] = [
  { type: "plain", key: "filter", label: "Search", icon: MagnifyingGlass },
  { type: "plain", key: "gameId", label: "Game ID" },
  { type: "plain", key: "title", label: "Title" },
  {
    type: "multi",
    key: "eventType",
    map: EVENT_TYPES,
    prefix: "eventType",
    iconMap: EVENT_TYPE_ICONS,
  },
  { type: "plain", key: "group", label: "Group" },
  { type: "plain", key: "shortDescription", label: "Short desc" },
  { type: "plain", key: "longDescription", label: "Long desc" },
  { type: "plain", key: "gameSystem", label: "System", icon: RuleBook },
  { type: "plain", key: "rulesEdition", label: "Rules", icon: RuleBook },
  { type: "enum", key: "ageRequired", label: "Age", map: AGE_GROUPS, icon: Ages },
  { type: "enum", key: "experienceRequired", label: "Exp", map: EXP, icon: Skills },
  { type: "plain", key: "materialsProvided", label: "Materials provided", icon: Backpack },
  {
    type: "enum",
    key: "materialsRequired",
    label: "Materials required",
    map: YES_NO,
    icon: Backpack,
  },
  { type: "plain", key: "materialsRequiredDetails", label: "Materials details", icon: Backpack },
  { type: "multi", key: "days", map: DAY_LABELS, prefix: "days", icon: Calendar },
  { type: "range", key: "duration", label: "Duration", suffix: "hrs", icon: Hourglass },
  { type: "range", key: "minPlayers", label: "Min players", icon: Meeple },
  { type: "range", key: "maxPlayers", label: "Max players", icon: Meeple },
  { type: "plain", key: "gmNames", label: "GM" },
  { type: "plain", key: "website", label: "Website" },
  { type: "plain", key: "email", label: "Email" },
  { type: "enum", key: "tournament", label: "Tournament", map: YES_NO, icon: Trophy },
  { type: "range", key: "roundNumber", label: "Round" },
  { type: "range", key: "totalRounds", label: "Total rounds" },
  { type: "range", key: "minimumPlayTime", label: "Min play time", icon: Hourglass },
  {
    type: "enum",
    key: "attendeeRegistration",
    label: "Registration",
    map: REGISTRATION,
    icon: Ticket,
  },
  { type: "cost", key: "cost", icon: Coins },
  { type: "plain", key: "location", label: "Location", icon: PositionMarker },
  { type: "plain", key: "roomName", label: "Room", icon: PositionMarker },
  { type: "plain", key: "tableNumber", label: "Table" },
  { type: "enum", key: "specialCategory", label: "Category", map: CATEGORY, icon: BeveledStar },
  { type: "range", key: "ticketsAvailable", label: "Tickets", icon: Ticket },
  { type: "dateRange", key: "lastModified", label: "Modified", icon: Calendar },
];
```

- [ ] **Step 3: Add `icon: Hourglass` to the timeRange special case**

In the `getActiveFilters` function, find the `timeRange` chip push (lines ~163–169) and add `icon: Hourglass`:

```typescript
filters.push({
  id: "timeRange",
  label,
  icon: Hourglass,
  remove: (prev) => {
    const { timeStart: _s, timeEnd: _e, ...rest } = prev;
    return rest;
  },
});
```

- [ ] **Step 4: Run icon assignment tests**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: all tests pass including the new icon assertions.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts
git commit -m "feat(filter-icons): wire icon assignments into getActiveFilters"
```

---

## Task 8: Update `ActiveFilters` component to render icons

**Files:**

- Modify: `src/ui/ActiveFilters/ActiveFilters.tsx`

- [ ] **Step 1: Render icon before label text**

In `ActiveFilters.tsx`, update the `Button` contents to render the icon when present:

```tsx
<Button variant="ghost" className={styles.chip} onClick={() => onRemove(filter)}>
  {filter.icon && <filter.icon size={12} />}
  {filter.label} <span aria-hidden="true">×</span>
</Button>
```

The `createIcon()` utility automatically applies `aria-hidden="true"` when no aria props are passed, so no explicit `aria-hidden` is needed on the icon here.

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc -b --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ActiveFilters/ActiveFilters.tsx
git commit -m "feat(filter-icons): render icon in active filter pills"
```

---

## Task 9: Add render test for icon display in `ActiveFilters`

**Files:**

- Modify or create: `src/ui/ActiveFilters/ActiveFilters.test.tsx`

Check whether this file already exists:

```bash
ls src/ui/ActiveFilters/
```

- [ ] **Step 1: Add icon render test**

If `ActiveFilters.test.tsx` does not exist, create it. If it exists, append the new tests.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActiveFilters } from "./ActiveFilters";

describe("ActiveFilters", () => {
  it("renders icon before label when filter has an icon", () => {
    // tournament: "Yes" → Trophy icon wired in via getActiveFilters (Task 7)
    const { container } = render(
      <ActiveFilters searchParams={{ tournament: "Yes" }} onRemove={vi.fn()} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Tournament: Yes")).toBeTruthy();
  });

  it("renders no svg when filter has no icon", () => {
    // title has no icon assigned in FILTER_DEFS
    const { container } = render(
      <ActiveFilters searchParams={{ title: "dragon" }} onRemove={vi.fn()} />,
    );
    expect(container.querySelector("svg")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the new test**

```bash
npx vitest run src/ui/ActiveFilters/ActiveFilters.test.tsx
```

Expected: both tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ActiveFilters/ActiveFilters.test.tsx
git commit -m "test(filter-icons): add ActiveFilters icon render coverage"
```

---

## Task 10: Commit the design spec (blocked until SearchForm TS error is fixed)

The spec at `docs/superpowers/specs/2026-05-02-filter-pill-icons-design.md` and this plan are already on disk but not committed due to a pre-existing TypeScript error in `SearchForm.tsx` (`keepMounted` prop). Once that is resolved:

```bash
git add docs/superpowers/specs/2026-05-02-filter-pill-icons-design.md \
        docs/superpowers/plans/2026-05-02-filter-pill-icons.md
git commit -m "docs: add filter pill icons spec and implementation plan"
```
