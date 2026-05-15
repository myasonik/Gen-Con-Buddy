export interface EventAttributes {
  gameId: string;
  year: number;
  group: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  eventType: string;
  gameSystem: string;
  rulesEdition: string;
  minPlayers: number;
  maxPlayers: number;
  ageRequired: string;
  experienceRequired: string;
  materialsProvided: string;
  materialsRequired: string;
  materialsRequiredDetails: string;
  startDateTime: string;
  duration: number;
  endDateTime: string;
  gmNames: string;
  website: string;
  email: string;
  tournament: string;
  roundNumber: number;
  totalRounds: number;
  minimumPlayTime: number;
  attendeeRegistration: string;
  cost: number;
  location: string;
  roomName: string;
  tableNumber: string;
  specialCategory: string;
  ticketsAvailable: number;
  lastModified: string;
  alsoRuns: string;
  prize: string;
  rulesComplexity: string;
  originalOrder: number;
}

export interface Event {
  id: string;
  type: string;
  attributes: EventAttributes;
}

export interface EventSearchResponse {
  data: Event[];
  meta: { total: number };
  links: {
    self: string;
    first?: string;
    last?: string;
    previous?: string;
    next?: string;
  };
  error: { status: string; detail: string } | null;
}

export interface ChangelogSummary {
  id: string;
  date: string;
  updatedCount: number;
  deletedCount: number;
  createdCount: number;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  updatedEvents: Event[];
  deletedEvents: Event[];
  createdEvents: Event[];
}

export interface ListChangelogsResponse {
  error?: string;
  entries?: ChangelogSummary[];
}

export interface FetchChangelogResponse {
  error?: string;
  entry?: ChangelogEntry;
}

export interface GameSystemFacet {
  value: string;
  count: number;
}

export interface GameSystemFacetsResponse {
  error?: string;
  values?: GameSystemFacet[];
}

export interface SortState {
  field: string;
  dir: "asc" | "desc";
}
