export const SCHEMA = {
  // Pagination
  limit: "number",
  page: "number",

  // API-computed — present in SearchParams but never touch the form
  startDateTime: "apiOnly",
  endDateTime: "apiOnly",
  sort: "apiOnly",

  // Simple string passthroughs
  filter: "string",
  gameId: "string",
  title: "string",
  eventType: "string",
  group: "string",
  shortDescription: "string",
  longDescription: "string",
  gameSystem: "string",
  rulesEdition: "string",
  ageRequired: "string",
  experienceRequired: "string",
  materialsProvided: "string",
  materialsRequired: "string",
  materialsRequiredDetails: "string",
  gmNames: "string",
  website: "string",
  email: "string",
  tournament: "string",
  attendeeRegistration: "string",
  location: "string",
  roomName: "string",
  tableNumber: "string",
  specialCategory: "string",
  days: "string",
  timeStart: "string",
  timeEnd: "string",

  // Range fields — encoded as "[min,max]" in the URL
  minPlayers: "range",
  maxPlayers: "range",
  duration: "range",
  roundNumber: "range",
  totalRounds: "range",
  minimumPlayTime: "range",
  cost: "range",
  ticketsAvailable: "range",

  // Date range — encoded as "[isoStart,isoEnd]" in the URL
  lastModified: "dateRange",
} as const satisfies Record<string, "string" | "number" | "range" | "dateRange" | "apiOnly">;

type Schema = typeof SCHEMA;
type SchemaKey = keyof Schema;

/** URL search params — map directly to API query params. Ranges encoded as "[min,max]". */
export type SearchParams = {
  [K in SchemaKey]?: Schema[K] extends "number" ? number : string;
};

type FormKey<K extends SchemaKey> = Schema[K] extends "range"
  ? `${K}Min` | `${K}Max`
  : Schema[K] extends "dateRange"
    ? `${K}Start` | `${K}End`
    : Schema[K] extends "apiOnly" | "number"
      ? never
      : K;

/** React Hook Form values — ranges split into min/max fields. */
export type SearchFormValues = {
  [K in SchemaKey as FormKey<K>]?: string;
};

function parseRange(val: string | undefined): {
  min: string | undefined;
  max: string | undefined;
} {
  const match = val?.match(/^\[([^,]*),([^\]]*)\]$/);
  return match ? { min: match[1], max: match[2] } : { min: undefined, max: undefined };
}

function parseDateRange(val: string | undefined): {
  start: string | undefined;
  end: string | undefined;
} {
  const match = val?.match(/^\[([^,]*),([^\]]*)\]$/);
  if (!match) {
    return { start: undefined, end: undefined };
  }
  return {
    start: match[1] ? match[1].replace(/:00Z$/, "") : "",
    end: match[2] ? match[2].replace(/:00Z$/, "") : "",
  };
}

export function coerceSearchParams(raw: Record<string, unknown>): SearchParams {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMA) as SchemaKey[]) {
    const val = raw[key];
    if (SCHEMA[key] === "number") {
      if (typeof val === "number") {
        result[key] = val;
      }
    } else {
      if (typeof val === "string") {
        result[key] = val;
      }
    }
  }
  return result as SearchParams;
}

export function parseSearchParams(params: SearchParams): SearchFormValues {
  const p = params as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMA) as SchemaKey[]) {
    const kind = SCHEMA[key];
    const val = p[key] as string | undefined;
    if (kind === "string") {
      result[key] = val;
    } else if (kind === "range") {
      const { min, max } = parseRange(val);
      result[`${key}Min`] = val ? min : undefined;
      result[`${key}Max`] = val ? max : undefined;
    } else if (kind === "dateRange") {
      const { start, end } = parseDateRange(val);
      result[`${key}Start`] = val ? start : undefined;
      result[`${key}End`] = val ? end : undefined;
    }
    // 'number' and 'apiOnly' have no form fields — skip
  }
  return result as SearchFormValues;
}

export function buildSearchParams(values: SearchFormValues): SearchParams {
  const v = values as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMA) as SchemaKey[]) {
    const kind = SCHEMA[key];
    if (kind === "string") {
      const val = v[key] as string | undefined;
      if (val) {
        result[key] = val;
      }
    } else if (kind === "range") {
      const min = v[`${key}Min`] as string | undefined;
      const max = v[`${key}Max`] as string | undefined;
      if (min || max) {
        result[key] = `[${min ?? ""},${max ?? ""}]`;
      }
    } else if (kind === "dateRange") {
      const start = v[`${key}Start`] as string | undefined;
      const end = v[`${key}End`] as string | undefined;
      if (start || end) {
        result[key] = `[${start ? `${start}:00Z` : ""},${end ? `${end}:00Z` : ""}]`;
      }
    }
    // 'number' and 'apiOnly' are set externally (handleNavigate / handleSort)
  }
  return result as SearchParams;
}
