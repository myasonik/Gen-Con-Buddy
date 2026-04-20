import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import {
  DAY_COLORS,
  EVENT_TYPE_COLORS,
  type ConceptColor,
} from "../../utils/conceptColors";
import type { SearchParams } from "../../utils/types";

export interface ActiveFilter {
  id: string;
  label: string;
  colors?: ConceptColor;
  remove: (prev: SearchParams) => SearchParams;
}

const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DAY_FULL_NAMES: Record<string, string> = {
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function parseRange(val: string): { min: string; max: string } | null {
  const m = val.match(/^\[([^,]*),([^\]]*)\]$/);
  if (!m) return null;
  return { min: m[1], max: m[2] };
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRange(val: string, prefix: string, suffix = ""): string {
  const r = parseRange(val);
  if (!r) return `${prefix}${val}`;
  return `${prefix}${r.min}–${r.max}${suffix ? " " + suffix : ""}`;
}

function fmtDateRange(val: string, prefix: string): string {
  const r = parseRange(val);
  if (!r) return `${prefix}${val}`;
  return `${prefix}${fmtDate(r.min)}–${fmtDate(r.max)}`;
}

function fmtCostRange(val: string): string {
  const r = parseRange(val);
  if (!r) return `Cost: ${val}`;
  const min = r.min ? `$${r.min}` : "";
  const max = r.max ? `$${r.max}` : "";
  const dash = min || max ? "–" : "";
  return `Cost: ${min}${dash}${max}`;
}

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  const add = (key: keyof SearchParams, label: string) => {
    filters.push({
      id: key,
      label,
      remove: (prev) => ({ ...prev, [key]: undefined }),
    });
  };

  if (params.filter) add("filter", `Search: ${params.filter}`);
  if (params.gameId) add("gameId", `Game ID: ${params.gameId}`);
  if (params.title) add("title", `Title: ${params.title}`);
  if (params.eventType) {
    for (const code of params.eventType.split(",").filter(Boolean)) {
      const label = EVENT_TYPES[code] ?? code;
      filters.push({
        id: `eventType:${code}`,
        label,
        colors: EVENT_TYPE_COLORS[code],
        remove: (prev) => {
          const remaining = (prev.eventType ?? "")
            .split(",")
            .filter((c) => c !== code)
            .join(",");
          return { ...prev, eventType: remaining || undefined };
        },
      });
    }
  }
  if (params.group) add("group", `Group: ${params.group}`);
  if (params.shortDescription)
    add("shortDescription", `Short desc: ${params.shortDescription}`);
  if (params.longDescription)
    add("longDescription", `Long desc: ${params.longDescription}`);
  if (params.gameSystem) add("gameSystem", `System: ${params.gameSystem}`);
  if (params.rulesEdition) add("rulesEdition", `Rules: ${params.rulesEdition}`);
  if (params.ageRequired)
    add(
      "ageRequired",
      `Age: ${AGE_GROUPS[params.ageRequired] ?? params.ageRequired}`,
    );
  if (params.experienceRequired)
    add(
      "experienceRequired",
      `Exp: ${EXP[params.experienceRequired] ?? params.experienceRequired}`,
    );
  if (params.materialsProvided)
    add("materialsProvided", `Materials provided: ${params.materialsProvided}`);
  if (params.materialsRequired)
    add("materialsRequired", `Materials required: ${params.materialsRequired}`);
  if (params.materialsRequiredDetails)
    add(
      "materialsRequiredDetails",
      `Materials details: ${params.materialsRequiredDetails}`,
    );
  if (params.days) {
    for (const code of params.days.split(",").filter(Boolean)) {
      const label = DAY_LABELS[code] ?? code;
      filters.push({
        id: `days:${code}`,
        label,
        colors: DAY_COLORS[DAY_FULL_NAMES[code] ?? ""],
        remove: (prev) => {
          const remaining = (prev.days ?? "")
            .split(",")
            .filter((d) => d !== code)
            .join(",");
          return { ...prev, days: remaining || undefined };
        },
      });
    }
  }
  if (params.startDateTime)
    add("startDateTime", fmtDateRange(params.startDateTime, "Start: "));
  if (params.duration)
    add("duration", fmtRange(params.duration, "Duration: ", "hrs"));
  if (params.endDateTime)
    add("endDateTime", fmtDateRange(params.endDateTime, "End: "));
  if (params.minPlayers)
    add("minPlayers", fmtRange(params.minPlayers, "Min players: "));
  if (params.maxPlayers)
    add("maxPlayers", fmtRange(params.maxPlayers, "Max players: "));
  if (params.gmNames) add("gmNames", `GM: ${params.gmNames}`);
  if (params.website) add("website", `Website: ${params.website}`);
  if (params.email) add("email", `Email: ${params.email}`);
  if (params.tournament) add("tournament", `Tournament: ${params.tournament}`);
  if (params.roundNumber)
    add("roundNumber", fmtRange(params.roundNumber, "Round: "));
  if (params.totalRounds)
    add("totalRounds", fmtRange(params.totalRounds, "Total rounds: "));
  if (params.minimumPlayTime)
    add("minimumPlayTime", fmtRange(params.minimumPlayTime, "Min play time: "));
  if (params.attendeeRegistration)
    add(
      "attendeeRegistration",
      `Registration: ${REGISTRATION[params.attendeeRegistration] ?? params.attendeeRegistration}`,
    );
  if (params.cost) add("cost", fmtCostRange(params.cost));
  if (params.location) add("location", `Location: ${params.location}`);
  if (params.roomName) add("roomName", `Room: ${params.roomName}`);
  if (params.tableNumber) add("tableNumber", `Table: ${params.tableNumber}`);
  if (params.specialCategory)
    add(
      "specialCategory",
      `Category: ${CATEGORY[params.specialCategory] ?? params.specialCategory}`,
    );
  if (params.ticketsAvailable)
    add("ticketsAvailable", fmtRange(params.ticketsAvailable, "Tickets: "));
  if (params.lastModified)
    add("lastModified", fmtDateRange(params.lastModified, "Modified: "));

  return filters;
}
