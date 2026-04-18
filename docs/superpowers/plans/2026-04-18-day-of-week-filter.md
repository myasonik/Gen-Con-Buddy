# Day-of-Week Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add top-level Wed–Sun day checkboxes to the search form that filter events by start date, mutually exclusive with the advanced Start Date fields.

**Architecture:** A new `days` string field (comma-separated day keys) is added to `SearchFormValues` and `SearchParams`. `buildSearchParams` translates selected days into a multi-range `startDateTime` API param; `parseSearchParams` round-trips `days` directly. The form renders a checkbox group above the advanced section with mutual exclusion logic and a toggletip.

**Tech Stack:** React, React Hook Form (`useForm`, `watch`, `setValue`), TypeScript, Vitest, @testing-library/react

---

## File Map

- **Modify:** `src/utils/types.ts` — add `days?: string` to `SearchParams` and `SearchFormValues`
- **Modify:** `src/utils/searchParams.ts` — add `DAY_DATES` constant, update `buildSearchParams` and `parseSearchParams`
- **Modify:** `src/utils/searchParams.test.ts` — add tests for `days` behavior in both directions
- **Modify:** `src/components/SearchForm/SearchForm.tsx` — add checkbox group, mutual exclusion, toggletip
- **Modify:** `src/components/SearchForm/SearchForm.test.tsx` — add tests for new UI behavior

---

## Task 1: Add `days` to types

**Files:**
- Modify: `src/utils/types.ts`

- [ ] **Step 1: Add `days` to `SearchParams`**

In `src/utils/types.ts`, add `days?: string` to the `SearchParams` interface after the `lastModified` field:

```ts
/** URL search params — map directly to API query params. Ranges encoded as "[min,max]". */
export interface SearchParams {
  limit?: number
  filter?: string
  gameId?: string
  title?: string
  eventType?: string
  group?: string
  shortDescription?: string
  longDescription?: string
  gameSystem?: string
  rulesEdition?: string
  minPlayers?: string
  maxPlayers?: string
  ageRequired?: string
  experienceRequired?: string
  materialsProvided?: string
  materialsRequired?: string
  materialsRequiredDetails?: string
  startDateTime?: string
  duration?: string
  endDateTime?: string
  gmNames?: string
  website?: string
  email?: string
  tournament?: string
  roundNumber?: string
  totalRounds?: string
  minimumPlayTime?: string
  attendeeRegistration?: string
  cost?: string
  location?: string
  roomName?: string
  tableNumber?: string
  specialCategory?: string
  ticketsAvailable?: string
  lastModified?: string
  days?: string
}
```

- [ ] **Step 2: Add `days` to `SearchFormValues`**

In `src/utils/types.ts`, add `days?: string` to the `SearchFormValues` interface after the `lastModifiedEnd` field:

```ts
/** React Hook Form values — ranges split into min/max fields. */
export interface SearchFormValues {
  filter?: string
  gameId?: string
  title?: string
  eventType?: string
  group?: string
  shortDescription?: string
  longDescription?: string
  gameSystem?: string
  rulesEdition?: string
  minPlayersMin?: string
  minPlayersMax?: string
  maxPlayersMin?: string
  maxPlayersMax?: string
  ageRequired?: string
  experienceRequired?: string
  materialsProvided?: string
  materialsRequired?: string
  materialsRequiredDetails?: string
  startDateTimeStart?: string
  startDateTimeEnd?: string
  durationMin?: string
  durationMax?: string
  endDateTimeStart?: string
  endDateTimeEnd?: string
  gmNames?: string
  website?: string
  email?: string
  tournament?: string
  roundNumberMin?: string
  roundNumberMax?: string
  totalRoundsMin?: string
  totalRoundsMax?: string
  minimumPlayTimeMin?: string
  minimumPlayTimeMax?: string
  attendeeRegistration?: string
  costMin?: string
  costMax?: string
  location?: string
  roomName?: string
  tableNumber?: string
  specialCategory?: string
  ticketsAvailableMin?: string
  ticketsAvailableMax?: string
  lastModifiedStart?: string
  lastModifiedEnd?: string
  days?: string
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/types.ts
git commit -m "feat: add days field to SearchParams and SearchFormValues"
```

---

## Task 2: Update `buildSearchParams` for `days`

**Files:**
- Modify: `src/utils/searchParams.ts`
- Modify: `src/utils/searchParams.test.ts`

- [ ] **Step 1: Write failing tests**

Add to the `describe('buildSearchParams')` block in `src/utils/searchParams.test.ts`:

```ts
it('translates a single day to a startDateTime range', () => {
  const result = buildSearchParams({ days: 'thu' })
  expect(result.startDateTime).toBe('[2024-08-01T00:00:00-04:00,2024-08-02T00:00:00-04:00]')
  expect(result).not.toHaveProperty('days')
})

it('translates two non-contiguous days to a comma-separated multi-range startDateTime', () => {
  const result = buildSearchParams({ days: 'wed,sun' })
  expect(result.startDateTime).toBe(
    '[2024-07-31T00:00:00-04:00,2024-08-01T00:00:00-04:00],[2024-08-04T00:00:00-04:00,2024-08-05T00:00:00-04:00]'
  )
  expect(result).not.toHaveProperty('days')
})

it('translates all five days to five ranges', () => {
  const result = buildSearchParams({ days: 'wed,thu,fri,sat,sun' })
  expect(result.startDateTime).toBe(
    '[2024-07-31T00:00:00-04:00,2024-08-01T00:00:00-04:00],' +
    '[2024-08-01T00:00:00-04:00,2024-08-02T00:00:00-04:00],' +
    '[2024-08-02T00:00:00-04:00,2024-08-03T00:00:00-04:00],' +
    '[2024-08-03T00:00:00-04:00,2024-08-04T00:00:00-04:00],' +
    '[2024-08-04T00:00:00-04:00,2024-08-05T00:00:00-04:00]'
  )
})

it('does not set startDateTime when days is empty', () => {
  const result = buildSearchParams({ days: '' })
  expect(result).not.toHaveProperty('startDateTime')
  expect(result).not.toHaveProperty('days')
})

it('uses explicit startDateTime fields when days is not set', () => {
  const result = buildSearchParams({ startDateTimeStart: '2024-08-01T10:00', startDateTimeEnd: '' })
  expect(result.startDateTime).toBe('[2024-08-01T10:00:00Z,]')
})

it('days takes priority over explicit startDateTime fields when both are set', () => {
  const result = buildSearchParams({ days: 'fri', startDateTimeStart: '2024-08-01T10:00', startDateTimeEnd: '2024-08-01T14:00' })
  expect(result.startDateTime).toBe('[2024-08-02T00:00:00-04:00,2024-08-03T00:00:00-04:00]')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- searchParams
```

Expected: new tests fail with errors about missing functionality.

- [ ] **Step 3: Implement `DAY_DATES` and update `buildSearchParams`**

Replace the top of `src/utils/searchParams.ts` (keep the existing import and add the constant, then update `buildSearchParams`):

```ts
import type { SearchFormValues, SearchParams } from './types'

const DAY_DATES: Record<string, { start: string; end: string }> = {
  wed: { start: '2024-07-31T00:00:00-04:00', end: '2024-08-01T00:00:00-04:00' },
  thu: { start: '2024-08-01T00:00:00-04:00', end: '2024-08-02T00:00:00-04:00' },
  fri: { start: '2024-08-02T00:00:00-04:00', end: '2024-08-03T00:00:00-04:00' },
  sat: { start: '2024-08-03T00:00:00-04:00', end: '2024-08-04T00:00:00-04:00' },
  sun: { start: '2024-08-04T00:00:00-04:00', end: '2024-08-05T00:00:00-04:00' },
}

export function buildSearchParams(values: SearchFormValues): SearchParams {
  const params: SearchParams = {}

  const set = (key: keyof SearchParams, val: string | number | undefined | boolean) => {
    if (val === undefined || val === '' || val === false) return
    ;(params as Record<string, unknown>)[key] = val
  }

  const setRange = (
    key: keyof SearchParams,
    min: string | undefined,
    max: string | undefined,
  ) => {
    if (!min && !max) return
    ;(params as Record<string, unknown>)[key] = `[${min ?? ''},${max ?? ''}]`
  }

  const setDateRange = (
    key: keyof SearchParams,
    start: string | undefined,
    end: string | undefined,
  ) => {
    if (!start && !end) return
    const s = start ? `${start}:00Z` : ''
    const e = end ? `${end}:00Z` : ''
    ;(params as Record<string, unknown>)[key] = `[${s},${e}]`
  }

  set('filter', values.filter)
  set('gameId', values.gameId)
  set('title', values.title)
  set('eventType', values.eventType)
  set('group', values.group)
  set('shortDescription', values.shortDescription)
  set('longDescription', values.longDescription)
  set('gameSystem', values.gameSystem)
  set('rulesEdition', values.rulesEdition)
  setRange('minPlayers', values.minPlayersMin, values.minPlayersMax)
  setRange('maxPlayers', values.maxPlayersMin, values.maxPlayersMax)
  set('ageRequired', values.ageRequired)
  set('experienceRequired', values.experienceRequired)
  set('materialsProvided', values.materialsProvided)
  set('materialsRequired', values.materialsRequired)
  set('materialsRequiredDetails', values.materialsRequiredDetails)

  if (values.days) {
    const ranges = values.days
      .split(',')
      .filter(d => DAY_DATES[d])
      .map(d => `[${DAY_DATES[d].start},${DAY_DATES[d].end}]`)
      .join(',')
    if (ranges) {
      ;(params as Record<string, unknown>)['startDateTime'] = ranges
    }
  } else {
    setDateRange('startDateTime', values.startDateTimeStart, values.startDateTimeEnd)
  }

  setRange('duration', values.durationMin, values.durationMax)
  setDateRange('endDateTime', values.endDateTimeStart, values.endDateTimeEnd)
  set('gmNames', values.gmNames)
  set('website', values.website)
  set('email', values.email)
  set('tournament', values.tournament)
  setRange('roundNumber', values.roundNumberMin, values.roundNumberMax)
  setRange('totalRounds', values.totalRoundsMin, values.totalRoundsMax)
  setRange('minimumPlayTime', values.minimumPlayTimeMin, values.minimumPlayTimeMax)
  set('attendeeRegistration', values.attendeeRegistration)
  setRange('cost', values.costMin, values.costMax)
  set('location', values.location)
  set('roomName', values.roomName)
  set('tableNumber', values.tableNumber)
  set('specialCategory', values.specialCategory)
  setRange('ticketsAvailable', values.ticketsAvailableMin, values.ticketsAvailableMax)
  setDateRange('lastModified', values.lastModifiedStart, values.lastModifiedEnd)

  return params
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- searchParams
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/searchParams.ts src/utils/searchParams.test.ts
git commit -m "feat: translate days selection to startDateTime ranges in buildSearchParams"
```

---

## Task 3: Update `parseSearchParams` for `days`

**Files:**
- Modify: `src/utils/searchParams.ts`
- Modify: `src/utils/searchParams.test.ts`

- [ ] **Step 1: Write failing tests**

Add to the `describe('parseSearchParams')` block in `src/utils/searchParams.test.ts`:

```ts
it('round-trips days directly from URL params', () => {
  const result = parseSearchParams({ days: 'thu,sat' })
  expect(result.days).toBe('thu,sat')
})

it('returns undefined days when not in URL params', () => {
  const result = parseSearchParams({})
  expect(result.days).toBeUndefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- searchParams
```

Expected: new tests fail.

- [ ] **Step 3: Add `days` to `parseSearchParams` return value**

In `src/utils/searchParams.ts`, update the `return` object in `parseSearchParams` to include `days` at the end:

```ts
return {
  filter: params.filter,
  gameId: params.gameId,
  title: params.title,
  eventType: params.eventType,
  group: params.group,
  shortDescription: params.shortDescription,
  longDescription: params.longDescription,
  gameSystem: params.gameSystem,
  rulesEdition: params.rulesEdition,
  minPlayersMin: params.minPlayers ? minPlayers.min : undefined,
  minPlayersMax: params.minPlayers ? minPlayers.max : undefined,
  maxPlayersMin: params.maxPlayers ? maxPlayers.min : undefined,
  maxPlayersMax: params.maxPlayers ? maxPlayers.max : undefined,
  ageRequired: params.ageRequired,
  experienceRequired: params.experienceRequired,
  materialsProvided: params.materialsProvided,
  materialsRequired: params.materialsRequired,
  materialsRequiredDetails: params.materialsRequiredDetails,
  startDateTimeStart: params.startDateTime ? startDateTime.start : undefined,
  startDateTimeEnd: params.startDateTime ? startDateTime.end : undefined,
  durationMin: params.duration ? duration.min : undefined,
  durationMax: params.duration ? duration.max : undefined,
  endDateTimeStart: params.endDateTime ? endDateTime.start : undefined,
  endDateTimeEnd: params.endDateTime ? endDateTime.end : undefined,
  gmNames: params.gmNames,
  website: params.website,
  email: params.email,
  tournament: params.tournament,
  roundNumberMin: params.roundNumber ? roundNumber.min : undefined,
  roundNumberMax: params.roundNumber ? roundNumber.max : undefined,
  totalRoundsMin: params.totalRounds ? totalRounds.min : undefined,
  totalRoundsMax: params.totalRounds ? totalRounds.max : undefined,
  minimumPlayTimeMin: params.minimumPlayTime ? minimumPlayTime.min : undefined,
  minimumPlayTimeMax: params.minimumPlayTime ? minimumPlayTime.max : undefined,
  attendeeRegistration: params.attendeeRegistration,
  costMin: params.cost ? cost.min : undefined,
  costMax: params.cost ? cost.max : undefined,
  location: params.location,
  roomName: params.roomName,
  tableNumber: params.tableNumber,
  specialCategory: params.specialCategory,
  ticketsAvailableMin: params.ticketsAvailable ? ticketsAvailable.min : undefined,
  ticketsAvailableMax: params.ticketsAvailable ? ticketsAvailable.max : undefined,
  lastModifiedStart: params.lastModified ? lastModified.start : undefined,
  lastModifiedEnd: params.lastModified ? lastModified.end : undefined,
  days: params.days,
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- searchParams
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/searchParams.ts src/utils/searchParams.test.ts
git commit -m "feat: round-trip days through parseSearchParams"
```

---

## Task 4: Add day checkboxes to SearchForm

**Files:**
- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/components/SearchForm/SearchForm.test.tsx`:

```ts
const DAYS = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

test('renders day checkboxes in the top-level form area', () => {
  render(<SearchForm defaultValues={{}} onSearch={noop} />)
  for (const day of DAYS) {
    expect(screen.getByRole('checkbox', { name: day })).toBeInTheDocument()
  }
})

test('checking a day checkbox submits the correct days value', async () => {
  const user = userEvent.setup()
  const handleSearch = vi.fn<[SearchFormValues], void>()
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />)

  await user.click(screen.getByRole('checkbox', { name: 'Thu' }))
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(handleSearch.mock.calls[0][0].days).toBe('thu')
})

test('checking multiple day checkboxes submits comma-separated days', async () => {
  const user = userEvent.setup()
  const handleSearch = vi.fn<[SearchFormValues], void>()
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />)

  await user.click(screen.getByRole('checkbox', { name: 'Wed' }))
  await user.click(screen.getByRole('checkbox', { name: 'Sun' }))
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(handleSearch.mock.calls[0][0].days).toBe('wed,sun')
})

test('populates day checkboxes from defaultValues', () => {
  render(<SearchForm defaultValues={{ days: 'fri,sat' }} onSearch={noop} />)
  expect(screen.getByRole('checkbox', { name: 'Fri' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Sat' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Wed' })).not.toBeChecked()
})

test('Reset button clears day checkboxes', async () => {
  const user = userEvent.setup()
  render(<SearchForm defaultValues={{ days: 'thu' }} onSearch={noop} />)

  await user.click(screen.getByRole('button', { name: 'Reset' }))

  expect(screen.getByRole('checkbox', { name: 'Thu' })).not.toBeChecked()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- SearchForm
```

Expected: new tests fail.

- [ ] **Step 3: Implement the checkbox group in SearchForm**

Replace `src/components/SearchForm/SearchForm.tsx` with:

```tsx
import { useForm } from "react-hook-form";
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";

const EMPTY_VALUES: SearchFormValues = {
  filter: "",
  gameId: "",
  title: "",
  eventType: "",
  group: "",
  shortDescription: "",
  longDescription: "",
  gameSystem: "",
  rulesEdition: "",
  minPlayersMin: "",
  minPlayersMax: "",
  maxPlayersMin: "",
  maxPlayersMax: "",
  ageRequired: "",
  experienceRequired: "",
  materialsProvided: "",
  materialsRequired: "",
  materialsRequiredDetails: "",
  startDateTimeStart: "",
  startDateTimeEnd: "",
  durationMin: "",
  durationMax: "",
  endDateTimeStart: "",
  endDateTimeEnd: "",
  gmNames: "",
  website: "",
  email: "",
  tournament: "",
  roundNumberMin: "",
  roundNumberMax: "",
  totalRoundsMin: "",
  totalRoundsMax: "",
  minimumPlayTimeMin: "",
  minimumPlayTimeMax: "",
  attendeeRegistration: "",
  costMin: "",
  costMax: "",
  location: "",
  roomName: "",
  tableNumber: "",
  specialCategory: "",
  ticketsAvailableMin: "",
  ticketsAvailableMax: "",
  lastModifiedStart: "",
  lastModifiedEnd: "",
  days: "",
};

const DAY_KEYS = ["wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface SearchFormProps {
  defaultValues: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
}

export function SearchForm({ defaultValues, onSearch }: SearchFormProps) {
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<SearchFormValues>({ defaultValues });

  const days = watch("days") ?? "";
  const selectedDays = new Set(days ? days.split(",") : []);

  const handleDayChange = (key: string, checked: boolean) => {
    const next = new Set(selectedDays);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setValue("days", DAY_KEYS.filter((d) => next.has(d)).join(","));
  };

  return (
    <form onSubmit={handleSubmit(onSearch)}>
      <div>
        <label>
          Search
          <input type="text" {...register("filter")} />
        </label>
        <label>
          Event Type
          <select {...register("eventType")}>
            <option value="">Any</option>
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Days</legend>
          {DAY_KEYS.map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                aria-label={DAY_LABELS[key]}
                checked={selectedDays.has(key)}
                onChange={(e) => handleDayChange(key, e.target.checked)}
              />
              {DAY_LABELS[key]}
            </label>
          ))}
        </fieldset>
      </div>

      <details>
        <summary>Advanced filters</summary>
        <ul>
          <li>
            <label>
              Game ID <input type="text" {...register("gameId")} />
            </label>
          </li>
          <li>
            <label>
              Title <input type="text" {...register("title")} />
            </label>
          </li>
          <li>
            <label>
              Group <input type="text" {...register("group")} />
            </label>
          </li>
          <li>
            <label>
              Short Description{" "}
              <input type="text" {...register("shortDescription")} />
            </label>
          </li>
          <li>
            <label>
              Long Description{" "}
              <input type="text" {...register("longDescription")} />
            </label>
          </li>
          <li>
            <label>
              Game System <input type="text" {...register("gameSystem")} />
            </label>
          </li>
          <li>
            <label>
              Rules Edition <input type="text" {...register("rulesEdition")} />
            </label>
          </li>
          <li>
            Min Players:
            <label>
              from{" "}
              <input type="number" min="0" {...register("minPlayersMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("minPlayersMax")} />
            </label>
          </li>
          <li>
            Max Players:
            <label>
              from{" "}
              <input type="number" min="0" {...register("maxPlayersMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("maxPlayersMax")} />
            </label>
          </li>
          <li>
            <label>
              Age Required
              <select {...register("ageRequired")}>
                <option value="">Any</option>
                {Object.entries(AGE_GROUPS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            <label>
              Experience Required
              <select {...register("experienceRequired")}>
                <option value="">Any</option>
                {Object.entries(EXP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            <label>
              Materials Provided{" "}
              <input type="text" {...register("materialsProvided")} />
            </label>
          </li>
          <li>
            <label>
              Materials Required{" "}
              <input type="text" {...register("materialsRequired")} />
            </label>
          </li>
          <li>
            <label>
              Materials Required Details{" "}
              <input type="text" {...register("materialsRequiredDetails")} />
            </label>
          </li>
          <li>
            Start Date:
            <label>
              from{" "}
              <input
                type="datetime-local"
                {...register("startDateTimeStart")}
              />
            </label>
            <label>
              to{" "}
              <input type="datetime-local" {...register("startDateTimeEnd")} />
            </label>
          </li>
          <li>
            Duration (hours):
            <label>
              from <input type="number" min="0" {...register("durationMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("durationMax")} />
            </label>
          </li>
          <li>
            End Date:
            <label>
              from{" "}
              <input type="datetime-local" {...register("endDateTimeStart")} />
            </label>
            <label>
              to <input type="datetime-local" {...register("endDateTimeEnd")} />
            </label>
          </li>
          <li>
            <label>
              Game Masters <input type="text" {...register("gmNames")} />
            </label>
          </li>
          <li>
            <label>
              Website <input type="text" {...register("website")} />
            </label>
          </li>
          <li>
            <label>
              Email <input type="text" {...register("email")} />
            </label>
          </li>
          <li>
            <label>
              Tournament <input type="text" {...register("tournament")} />
            </label>
          </li>
          <li>
            Round Number:
            <label>
              from{" "}
              <input type="number" min="0" {...register("roundNumberMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("roundNumberMax")} />
            </label>
          </li>
          <li>
            Total Rounds:
            <label>
              from{" "}
              <input type="number" min="0" {...register("totalRoundsMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("totalRoundsMax")} />
            </label>
          </li>
          <li>
            Minimum Play Time:
            <label>
              from{" "}
              <input
                type="number"
                min="0"
                {...register("minimumPlayTimeMin")}
              />
            </label>
            <label>
              to{" "}
              <input
                type="number"
                min="0"
                {...register("minimumPlayTimeMax")}
              />
            </label>
          </li>
          <li>
            <label>
              Attendee Registration
              <select {...register("attendeeRegistration")}>
                <option value="">Any</option>
                {Object.entries(REGISTRATION).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            Cost:
            <label>
              from <input type="number" min="0" {...register("costMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("costMax")} />
            </label>
          </li>
          <li>
            <label>
              Location <input type="text" {...register("location")} />
            </label>
          </li>
          <li>
            <label>
              Room Name <input type="text" {...register("roomName")} />
            </label>
          </li>
          <li>
            <label>
              Table <input type="text" {...register("tableNumber")} />
            </label>
          </li>
          <li>
            <label>
              Special Category
              <select {...register("specialCategory")}>
                <option value="">Any</option>
                {Object.entries(CATEGORY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            Tickets Available:
            <label>
              from{" "}
              <input
                type="number"
                min="0"
                {...register("ticketsAvailableMin")}
              />
            </label>
            <label>
              to{" "}
              <input
                type="number"
                min="0"
                {...register("ticketsAvailableMax")}
              />
            </label>
          </li>
          <li>
            Last Modified:
            <label>
              from{" "}
              <input type="datetime-local" {...register("lastModifiedStart")} />
            </label>
            <label>
              to{" "}
              <input type="datetime-local" {...register("lastModifiedEnd")} />
            </label>
          </li>
        </ul>
      </details>

      <button type="submit">Search</button>
      <button type="button" onClick={() => reset(EMPTY_VALUES)}>
        Reset
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- SearchForm
```

Expected: all tests pass including new ones.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat: add day checkboxes to SearchForm"
```

---

## Task 5: Add mutual exclusion and toggletip

**Files:**
- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/components/SearchForm/SearchForm.test.tsx`:

```ts
test('day checkboxes are disabled when startDateTimeStart has a value', () => {
  render(<SearchForm defaultValues={{ startDateTimeStart: '2024-08-01T10:00' }} onSearch={noop} />)
  for (const day of DAYS) {
    expect(screen.getByRole('checkbox', { name: day })).toBeDisabled()
  }
})

test('day checkboxes are disabled when startDateTimeEnd has a value', () => {
  render(<SearchForm defaultValues={{ startDateTimeEnd: '2024-08-01T14:00' }} onSearch={noop} />)
  for (const day of DAYS) {
    expect(screen.getByRole('checkbox', { name: day })).toBeDisabled()
  }
})

test('start date inputs are disabled when any day is checked', () => {
  const { container } = render(<SearchForm defaultValues={{ days: 'thu' }} onSearch={noop} />)
  expect(container.querySelector<HTMLInputElement>('input[name="startDateTimeStart"]')).toBeDisabled()
  expect(container.querySelector<HTMLInputElement>('input[name="startDateTimeEnd"]')).toBeDisabled()
})

test('toggletip appears next to day checkboxes when they are disabled', () => {
  render(<SearchForm defaultValues={{ startDateTimeStart: '2024-08-01T10:00' }} onSearch={noop} />)
  expect(screen.getByRole('button', { name: /why.*day/i })).toBeInTheDocument()
})

test('toggletip appears next to start date fields when they are disabled', () => {
  render(<SearchForm defaultValues={{ days: 'thu' }} onSearch={noop} />)
  expect(screen.getByRole('button', { name: /why.*start date/i })).toBeInTheDocument()
})

test('toggletip message for disabled day checkboxes explains to clear start date', async () => {
  const user = userEvent.setup()
  render(<SearchForm defaultValues={{ startDateTimeStart: '2024-08-01T10:00' }} onSearch={noop} />)

  await user.click(screen.getByRole('button', { name: /why.*day/i }))

  expect(screen.getByRole('tooltip')).toHaveTextContent(/clear the start date fields/i)
})

test('toggletip message for disabled start date explains to clear day checkboxes', async () => {
  const user = userEvent.setup()
  render(<SearchForm defaultValues={{ days: 'thu' }} onSearch={noop} />)

  await user.click(screen.getByRole('button', { name: /why.*start date/i }))

  expect(screen.getByRole('tooltip')).toHaveTextContent(/clear the day checkboxes/i)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test -- SearchForm
```

Expected: new tests fail.

- [ ] **Step 3: Add mutual exclusion and toggletip to SearchForm**

Update `src/components/SearchForm/SearchForm.tsx` — add the `Toggletip` component and wire up the disabled state. Add this before the `SearchForm` function:

```tsx
function Toggletip({ label, message }: { label: string; message: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" style={{ position: "absolute", zIndex: 1 }}>
          {message}
        </span>
      )}
    </span>
  );
}
```

Add `import { useState } from "react";` to the top of the file (alongside the existing `useForm` import line).

Then in the `SearchForm` function body, add these derived values after the `selectedDays` declaration:

```tsx
const startDateTimeStart = watch("startDateTimeStart") ?? "";
const startDateTimeEnd = watch("startDateTimeEnd") ?? "";
const startDateActive = !!(startDateTimeStart || startDateTimeEnd);
const daysActive = selectedDays.size > 0;
const daysDisabled = startDateActive;
const startDateDisabled = daysActive;
```

Update the day checkboxes to use `disabled={daysDisabled}`:

```tsx
<fieldset>
  <legend>Days</legend>
  {daysDisabled && (
    <Toggletip
      label="Why are day filters disabled?"
      message="Clear the Start Date fields in Advanced Filters to use day checkboxes."
    />
  )}
  {DAY_KEYS.map((key) => (
    <label key={key}>
      <input
        type="checkbox"
        aria-label={DAY_LABELS[key]}
        checked={selectedDays.has(key)}
        disabled={daysDisabled}
        onChange={(e) => handleDayChange(key, e.target.checked)}
      />
      {DAY_LABELS[key]}
    </label>
  ))}
</fieldset>
```

Update the Start Date list item in the advanced section to use `disabled={startDateDisabled}`:

```tsx
<li>
  Start Date:
  {startDateDisabled && (
    <Toggletip
      label="Why are Start Date fields disabled?"
      message="Clear the day checkboxes above to use custom Start Date fields."
    />
  )}
  <label>
    from{" "}
    <input
      type="datetime-local"
      disabled={startDateDisabled}
      {...register("startDateTimeStart")}
    />
  </label>
  <label>
    to{" "}
    <input
      type="datetime-local"
      disabled={startDateDisabled}
      {...register("startDateTimeEnd")}
    />
  </label>
</li>
```

- [ ] **Step 4: Run ALL tests**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat: mutual exclusion and toggletip for day checkboxes vs start date fields"
```
