import type { SearchFormValues, SearchParams } from "./types";

// Update this each year once new event data is loaded. Gen Con always runs Wed–Sun in late July/early August.
export const GEN_CON_YEAR = 2024;

function genConWednesday(year: number): Date {
  const aug1 = new Date(year, 7, 1);
  const daysBack = (aug1.getDay() - 3 + 7) % 7;
  return new Date(year, 7, 1 - daysBack);
}

function offsetDateTime(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T00:00:00-04:00`;
}

const wed = genConWednesday(GEN_CON_YEAR);
const DAY_DATES: Record<string, { start: string; end: string }> = {
  wed: { start: offsetDateTime(wed, 0), end: offsetDateTime(wed, 1) },
  thu: { start: offsetDateTime(wed, 1), end: offsetDateTime(wed, 2) },
  fri: { start: offsetDateTime(wed, 2), end: offsetDateTime(wed, 3) },
  sat: { start: offsetDateTime(wed, 3), end: offsetDateTime(wed, 4) },
  sun: { start: offsetDateTime(wed, 4), end: offsetDateTime(wed, 5) },
};

export function daysToStartDateTime(days: string): string | undefined {
  const ranges = days
    .split(",")
    .filter((d) => DAY_DATES[d])
    .map((d) => `[${DAY_DATES[d].start},${DAY_DATES[d].end}]`)
    .join(",");
  return ranges || undefined;
}

export function buildSearchParams(values: SearchFormValues): SearchParams {
  const params: SearchParams = {};

  const set = (key: keyof SearchParams, val: string | number | undefined | boolean): void => {
    if (val === undefined || val === "" || val === false) {
      return;
    }
    (params as Record<string, unknown>)[key] = val;
  };

  const setRange = (
    key: keyof SearchParams,
    min: string | undefined,
    max: string | undefined,
  ): void => {
    if (!min && !max) {
      return;
    }
    (params as Record<string, unknown>)[key] = `[${min ?? ""},${max ?? ""}]`;
  };

  const setDateRange = (
    key: keyof SearchParams,
    start: string | undefined,
    end: string | undefined,
  ): void => {
    if (!start && !end) {
      return;
    }
    const s = start ? `${start}:00Z` : "";
    const e = end ? `${end}:00Z` : "";
    (params as Record<string, unknown>)[key] = `[${s},${e}]`;
  };

  set("filter", values.filter);
  set("gameId", values.gameId);
  set("title", values.title);
  set("eventType", values.eventType);
  set("group", values.group);
  set("shortDescription", values.shortDescription);
  set("longDescription", values.longDescription);
  set("gameSystem", values.gameSystem);
  set("rulesEdition", values.rulesEdition);
  setRange("minPlayers", values.minPlayersMin, values.minPlayersMax);
  setRange("maxPlayers", values.maxPlayersMin, values.maxPlayersMax);
  set("ageRequired", values.ageRequired);
  set("experienceRequired", values.experienceRequired);
  set("materialsProvided", values.materialsProvided);
  set("materialsRequired", values.materialsRequired);
  set("materialsRequiredDetails", values.materialsRequiredDetails);
  if (values.days) {
    params.days = values.days;
  } else {
    setDateRange("startDateTime", values.startDateTimeStart, values.startDateTimeEnd);
  }
  setRange("duration", values.durationMin, values.durationMax);
  setDateRange("endDateTime", values.endDateTimeStart, values.endDateTimeEnd);
  set("gmNames", values.gmNames);
  set("website", values.website);
  set("email", values.email);
  set("tournament", values.tournament);
  setRange("roundNumber", values.roundNumberMin, values.roundNumberMax);
  setRange("totalRounds", values.totalRoundsMin, values.totalRoundsMax);
  setRange("minimumPlayTime", values.minimumPlayTimeMin, values.minimumPlayTimeMax);
  set("attendeeRegistration", values.attendeeRegistration);
  setRange("cost", values.costMin, values.costMax);
  set("location", values.location);
  set("roomName", values.roomName);
  set("tableNumber", values.tableNumber);
  set("specialCategory", values.specialCategory);
  setRange("ticketsAvailable", values.ticketsAvailableMin, values.ticketsAvailableMax);
  setDateRange("lastModified", values.lastModifiedStart, values.lastModifiedEnd);

  return params;
}

export function parseSearchParams(params: SearchParams): SearchFormValues {
  const parseRange = (
    val: string | undefined,
  ): { min: string | undefined; max: string | undefined } => {
    if (val === undefined) {
      return { min: undefined, max: undefined };
    }
    const match = val.match(/^\[([^,]*),([^\]]*)\]$/);
    if (!match) {
      return { min: undefined, max: undefined };
    }
    return { min: match[1], max: match[2] };
  };

  const parseDateRange = (
    val: string | undefined,
  ): { start: string | undefined; end: string | undefined } => {
    if (val === undefined) {
      return { start: undefined, end: undefined };
    }
    const match = val.match(/^\[([^,]*),([^\]]*)\]$/);
    if (!match) {
      return { start: undefined, end: undefined };
    }
    return {
      start: match[1] ? match[1].replace(/:00Z$/, "") : "",
      end: match[2] ? match[2].replace(/:00Z$/, "") : "",
    };
  };

  const minPlayers = parseRange(params.minPlayers);
  const maxPlayers = parseRange(params.maxPlayers);
  const startDateTime = parseDateRange(params.startDateTime);
  const endDateTime = parseDateRange(params.endDateTime);
  const duration = parseRange(params.duration);
  const roundNumber = parseRange(params.roundNumber);
  const totalRounds = parseRange(params.totalRounds);
  const minimumPlayTime = parseRange(params.minimumPlayTime);
  const cost = parseRange(params.cost);
  const ticketsAvailable = parseRange(params.ticketsAvailable);
  const lastModified = parseDateRange(params.lastModified);

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
    startDateTimeStart: !params.days && params.startDateTime ? startDateTime.start : undefined,
    startDateTimeEnd: !params.days && params.startDateTime ? startDateTime.end : undefined,
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
  };
}
