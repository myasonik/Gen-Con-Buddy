import { AGE_GROUPS, CATEGORY, EVENT_TYPES, EXP, REGISTRATION } from '../../utils/enums'
import type { SearchParams } from '../../utils/types'

export interface ActiveFilter {
  id: string
  label: string
  remove: (prev: SearchParams) => SearchParams
}

const DAY_LABELS: Record<string, string> = {
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

function parseRange(val: string): { min: string; max: string } | null {
  const m = val.match(/^\[([^,]*),([^\]]*)\]$/)
  if (!m) {
    return null
  }
  return { min: m[1], max: m[2] }
}

function fmtDate(iso: string): string {
  if (!iso) {
    return ''
  }
  const d = new Date(iso)
  if (isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRange(val: string, prefix: string, suffix = ''): string {
  const r = parseRange(val)
  if (!r) {
    return `${prefix}${val}`
  }
  return `${prefix}${r.min}–${r.max}${suffix ? ` ${suffix}` : ''}`
}

function fmtDateRange(val: string, prefix: string): string {
  const r = parseRange(val)
  if (!r) {
    return `${prefix}${val}`
  }
  return `${prefix}${fmtDate(r.min)}–${fmtDate(r.max)}`
}

function fmtCostRange(val: string): string {
  const r = parseRange(val)
  if (!r) {
    return `Cost: ${val}`
  }
  const min = r.min ? `$${r.min}` : ''
  const max = r.max ? `$${r.max}` : ''
  const dash = min || max ? '–' : ''
  return `Cost: ${min}${dash}${max}`
}

function removeKey(key: keyof SearchParams): (prev: SearchParams) => SearchParams {
  return (prev) => {
    const { [key]: _r, ...rest } = prev
    return rest
  }
}

interface PlainDef { type: 'plain'; key: keyof SearchParams; label: string }
interface EnumDef { type: 'enum'; key: keyof SearchParams; label: string; map: Record<string, string> }
interface RangeDef { type: 'range'; key: keyof SearchParams; label: string; suffix?: string }
interface DateRangeDef { type: 'dateRange'; key: keyof SearchParams; label: string }
interface CostDef { type: 'cost'; key: 'cost' }
interface MultiDef { type: 'multi'; key: keyof SearchParams; map: Record<string, string>; prefix: string }
type FilterDef = PlainDef | EnumDef | RangeDef | DateRangeDef | CostDef | MultiDef

const FILTER_DEFS: FilterDef[] = [
  { type: 'plain', key: 'filter', label: 'Search' },
  { type: 'plain', key: 'gameId', label: 'Game ID' },
  { type: 'plain', key: 'title', label: 'Title' },
  { type: 'multi', key: 'eventType', map: EVENT_TYPES, prefix: 'eventType' },
  { type: 'plain', key: 'group', label: 'Group' },
  { type: 'plain', key: 'shortDescription', label: 'Short desc' },
  { type: 'plain', key: 'longDescription', label: 'Long desc' },
  { type: 'plain', key: 'gameSystem', label: 'System' },
  { type: 'plain', key: 'rulesEdition', label: 'Rules' },
  { type: 'enum', key: 'ageRequired', label: 'Age', map: AGE_GROUPS },
  { type: 'enum', key: 'experienceRequired', label: 'Exp', map: EXP },
  { type: 'plain', key: 'materialsProvided', label: 'Materials provided' },
  { type: 'plain', key: 'materialsRequired', label: 'Materials required' },
  { type: 'plain', key: 'materialsRequiredDetails', label: 'Materials details' },
  { type: 'multi', key: 'days', map: DAY_LABELS, prefix: 'days' },
  { type: 'dateRange', key: 'startDateTime', label: 'Start' },
  { type: 'range', key: 'duration', label: 'Duration', suffix: 'hrs' },
  { type: 'dateRange', key: 'endDateTime', label: 'End' },
  { type: 'range', key: 'minPlayers', label: 'Min players' },
  { type: 'range', key: 'maxPlayers', label: 'Max players' },
  { type: 'plain', key: 'gmNames', label: 'GM' },
  { type: 'plain', key: 'website', label: 'Website' },
  { type: 'plain', key: 'email', label: 'Email' },
  { type: 'plain', key: 'tournament', label: 'Tournament' },
  { type: 'range', key: 'roundNumber', label: 'Round' },
  { type: 'range', key: 'totalRounds', label: 'Total rounds' },
  { type: 'range', key: 'minimumPlayTime', label: 'Min play time' },
  { type: 'enum', key: 'attendeeRegistration', label: 'Registration', map: REGISTRATION },
  { type: 'cost', key: 'cost' },
  { type: 'plain', key: 'location', label: 'Location' },
  { type: 'plain', key: 'roomName', label: 'Room' },
  { type: 'plain', key: 'tableNumber', label: 'Table' },
  { type: 'enum', key: 'specialCategory', label: 'Category', map: CATEGORY },
  { type: 'range', key: 'ticketsAvailable', label: 'Tickets' },
  { type: 'dateRange', key: 'lastModified', label: 'Modified' },
]

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  for (const def of FILTER_DEFS) {
    const val = params[def.key]
    if (val) {
      if (def.type === 'plain') {
        filters.push({ id: def.key, label: `${def.label}: ${val}`, remove: removeKey(def.key) })
      } else if (def.type === 'enum') {
        const display = def.map[val as string] ?? (val as string)
        filters.push({ id: def.key, label: `${def.label}: ${display}`, remove: removeKey(def.key) })
      } else if (def.type === 'range') {
        filters.push({ id: def.key, label: fmtRange(val as string, `${def.label}: `, def.suffix), remove: removeKey(def.key) })
      } else if (def.type === 'dateRange') {
        filters.push({ id: def.key, label: fmtDateRange(val as string, `${def.label}: `), remove: removeKey(def.key) })
      } else if (def.type === 'cost') {
        filters.push({ id: def.key, label: fmtCostRange(val as string), remove: removeKey(def.key) })
      } else if (def.type === 'multi') {
        for (const code of (val as string).split(',').filter(Boolean)) {
          const label = def.map[code] ?? code
          const k = def.key
          filters.push({
            id: `${def.prefix}:${code}`,
            label,
            remove: (prev) => {
              const remaining = ((prev[k] ?? '') as string)
                .split(',')
                .filter((c) => c !== code)
                .join(',')
              if (!remaining) {
                const { [k]: _r, ...rest } = prev
                return rest
              }
              return { ...prev, [k]: remaining }
            },
          })
        }
      }
    }
  }

  return filters
}
