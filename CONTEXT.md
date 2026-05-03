# Gen Con Buddy

A fast, deeply filterable Event search tool for Gen Con attendees. Users search across 30+ criteria to plan their convention schedule; the Changelog view lets them track last-minute Event changes.

## Language

### Events

**Event**: A scheduled convention session with a defined GM, time slot, location, and player count — the central entity in the app.
_Avoid_: Quest (UI flavor copy only, not a domain term)

**Event Type**: One of 19 official Gen Con categories that classify what kind of activity an Event is (e.g. RPG, BGM, LRP). Each has a short code, a full name, and an icon.
_Avoid_: Event category, activity type

**GM (Game Master)**: The person who hosts and facilitates an Event. Applies across all Event Types — not limited to RPGs.
_Avoid_: Host, facilitator, organizer

**Special Category**: A Gen Con-assigned designation that elevates certain Events above the standard catalog. Values: "Gen Con presents" or "Premier Event". Passed through from Gen Con's data faithfully.

**Registration Type**: How access to an Event is granted — whether it requires a ticket, is free, is restricted to VIG badge holders, invite-only, etc.
_Avoid_: Access type, entry type

**Duration**: The total time slot Gen Con schedules for an Event.

**Minimum Play Time**: The game's actual minimum runtime. Distinct from Duration — the difference is absorbed by setup, teardown, and rules teaching. A developer should not treat these as interchangeable.

### Discovery

**Search**: The overall operation of querying Events against the Source Catalog. What the user initiates when they submit the form.
_Avoid_: Query (backend term for the same concept)

**Filter**: A single constraint applied within a Search — e.g. Event Type = RPG, Day = Thursday, cost range = $0–$10.
_Avoid_: Search param (the backend/URL encoding of the same concept)

**Active Filter**: A Filter currently applied to the Search, displayed as a removable chip below the search form.

### Data

**Source Catalog**: The official Gen Con-published event dataset that the API ingests. The upstream origin of all Event data in the app.
_Avoid_: Event catalog, data source, CSV

**Changelog Entry**: A snapshot of changes to the Event catalog between two Source Catalog ingestions, showing which Events were created, updated, or deleted.
_Avoid_: Sync, snapshot, data update

## Relationships

- An **Event** belongs to exactly one **Event Type**
- An **Event** has one **Registration Type** and optionally one **Special Category**
- An **Event** has both a **Duration** and a **Minimum Play Time**; they are not interchangeable
- A **Changelog Entry** records the delta between two successive **Source Catalog** ingestions
- A **Search** is composed of zero or more **Filters**
- An **Active Filter** is a **Filter** currently applied to the active **Search**

## Example dialogue

> **Dev:** "When a user picks RPG in the form, is that a Search or a Filter?"
> **Domain expert:** "It's a Filter — one constraint within a Search. The Search is the whole operation."

> **Dev:** "So an Active Filter is just a Filter that's been applied?"
> **Domain expert:** "Right. Active Filters are shown as chips below the form. Removing one updates the Search."

> **Dev:** "If a Source Catalog refresh removes 20 events, where does that show up?"
> **Domain expert:** "In the Changelog. Each refresh produces a Changelog Entry with the created, updated, and deleted counts."

## Flagged ambiguities

- The keyword freetext field is labeled "Search" in the UI but registered as `filter` in the form schema and API — resolved: "filter" is correct for this field's type; the label is a UI affordance, not a domain name.
- Backend code refers to all URL query parameters as "search params" — when discussing backend implementation, prefer the backend's own naming. This glossary reflects frontend/domain language.
- "Quest" appears in loading and empty-state UI copy — resolved: not a domain term. Events are always Events.
