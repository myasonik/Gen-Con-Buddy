import type React from "react";
import { parseCSV } from "../../utils/parseCSV";
import { AGE_GROUPS, CATEGORY, EVENT_TYPES, EXP, REGISTRATION, YES_NO } from "../../utils/enums";
import type { SearchParams } from "../../utils/searchParamSchema";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass";
import { Calendar } from "../../ui/icons/Calendar";
import { Hourglass } from "../../ui/icons/Hourglass";
import { Meeple } from "../../ui/icons/Meeple";
import { Coins } from "../../ui/icons/Coins";
import { Ticket } from "../../ui/icons/Ticket";
import { Trophy } from "../../ui/icons/Trophy";
import { Ages } from "../../ui/icons/Ages";
import { Skills } from "../../ui/icons/Skills";
import { PositionMarker } from "../../ui/icons/PositionMarker";
import { BeveledStar } from "../../ui/icons/BeveledStar";
import { RuleBook } from "../../ui/icons/RuleBook";
import { Backpack } from "../../ui/icons/Backpack";

export interface ActiveFilter {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string }>;
  remove: (prev: SearchParams) => SearchParams;
}

const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function parseRange(val: string): { min: string; max: string } | null {
  const m = val.match(/^\[([^,]*),([^\]]*)\]$/);
  if (!m) {
    return null;
  }
  return { min: m[1], max: m[2] };
}

function fmtDate(iso: string): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRange(val: string, prefix: string, suffix = ""): string {
  const r = parseRange(val);
  if (!r) {
    return `${prefix}${val}`;
  }
  return `${prefix}${r.min}–${r.max}${suffix ? ` ${suffix}` : ""}`;
}

function fmtDateRange(val: string, prefix: string): string {
  const r = parseRange(val);
  if (!r) {
    return `${prefix}${val}`;
  }
  return `${prefix}${fmtDate(r.min)}–${fmtDate(r.max)}`;
}

function fmtCostRange(val: string): string {
  const r = parseRange(val);
  if (!r) {
    return `Cost: ${val}`;
  }
  const min = r.min ? `$${r.min}` : "";
  const max = r.max ? `$${r.max}` : "";
  const dash = min || max ? "–" : "";
  return `Cost: ${min}${dash}${max}`;
}

function fmtTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const use12h =
    new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12 ?? false;
  if (!use12h) {
    return m === 0 ? `${hStr}:00` : `${hStr}:${mStr}`;
  }
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${mStr} ${ampm}`;
}

function removeKey(key: keyof SearchParams): (prev: SearchParams) => SearchParams {
  return (prev) => {
    const { [key]: _r, ...rest } = prev;
    return rest;
  };
}

interface PlainDef {
  type: "plain";
  key: keyof SearchParams;
  label: string;
  icon?: React.ComponentType<{ size?: number | string }>;
}
interface EnumDef {
  type: "enum";
  key: keyof SearchParams;
  label: string;
  map: Record<string, string>;
  icon?: React.ComponentType<{ size?: number | string }>;
}
interface RangeDef {
  type: "range";
  key: keyof SearchParams;
  label: string;
  suffix?: string;
  icon?: React.ComponentType<{ size?: number | string }>;
}
interface DateRangeDef {
  type: "dateRange";
  key: keyof SearchParams;
  label: string;
  icon?: React.ComponentType<{ size?: number | string }>;
}
interface CostDef {
  type: "cost";
  key: "cost";
  icon?: React.ComponentType<{ size?: number | string }>;
}
interface MultiDef {
  type: "multi";
  key: keyof SearchParams;
  map?: Record<string, string>;
  prefix: string;
  icon?: React.ComponentType<{ size?: number | string }>;
  iconMap?: Record<string, React.ComponentType<{ size?: number | string }>>;
}
type FilterDef = PlainDef | EnumDef | RangeDef | DateRangeDef | CostDef | MultiDef;

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
  { type: "multi", key: "gameSystem", prefix: "gameSystem", icon: RuleBook },
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

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  // Time range chip — combines timeStart and timeEnd into one removable chip
  const { timeStart, timeEnd } = params;
  if (timeStart || timeEnd) {
    let label = `Before ${fmtTime(timeEnd ?? "")}`;
    if (timeStart && timeEnd) {
      label = `${fmtTime(timeStart)}–${fmtTime(timeEnd)}`;
    } else if (timeStart) {
      label = `After ${fmtTime(timeStart)}`;
    }
    filters.push({
      id: "timeRange",
      label,
      icon: Hourglass,
      remove: (prev) => {
        const { timeStart: _s, timeEnd: _e, ...rest } = prev;
        return rest;
      },
    });
  }

  for (const def of FILTER_DEFS) {
    const val = params[def.key];
    if (val) {
      if (def.type === "plain") {
        filters.push({
          id: def.key,
          label: `${def.label}: ${val}`,
          icon: def.icon,
          remove: removeKey(def.key),
        });
      } else if (def.type === "enum") {
        const display = def.map[val as string] ?? (val as string);
        filters.push({
          id: def.key,
          label: `${def.label}: ${display}`,
          icon: def.icon,
          remove: removeKey(def.key),
        });
      } else if (def.type === "range") {
        filters.push({
          id: def.key,
          label: fmtRange(val as string, `${def.label}: `, def.suffix),
          icon: def.icon,
          remove: removeKey(def.key),
        });
      } else if (def.type === "dateRange") {
        filters.push({
          id: def.key,
          label: fmtDateRange(val as string, `${def.label}: `),
          icon: def.icon,
          remove: removeKey(def.key),
        });
      } else if (def.type === "cost") {
        filters.push({
          id: def.key,
          label: fmtCostRange(val as string),
          icon: def.icon,
          remove: removeKey(def.key),
        });
      } else if (def.type === "multi") {
        for (const code of parseCSV(val as string)) {
          const label = def.map?.[code] ?? code;
          const k = def.key;
          const chipIcon = def.iconMap ? def.iconMap[code] : def.icon;
          filters.push({
            id: `${def.prefix}:${code}`,
            label,
            icon: chipIcon,
            remove: (prev) => {
              const remaining = ((prev[k] ?? "") as string)
                .split(",")
                .filter((c) => c !== code)
                .join(",");
              if (!remaining) {
                const { [k]: _r, ...rest } = prev;
                return rest;
              }
              return { ...prev, [k]: remaining };
            },
          });
        }
      } else {
        const _exhaustiveCheck: never = def;
        throw new Error(`Unhandled filter def type: ${JSON.stringify(_exhaustiveCheck)}`);
      }
    }
  }

  return filters;
}
