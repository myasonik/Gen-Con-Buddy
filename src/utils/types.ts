export interface EventAttributes {
  gameId: string
  year: number
  group: string
  title: string
  shortDescription: string
  longDescription: string
  eventType: string
  gameSystem: string
  rulesEdition: string
  minPlayers: number
  maxPlayers: number
  ageRequired: string
  experienceRequired: string
  materialsProvided: string
  materialsRequired: string
  materialsRequiredDetails: string
  startDateTime: string
  duration: number
  endDateTime: string
  gmNames: string
  website: string
  email: string
  tournament: string
  roundNumber: number
  totalRounds: number
  minimumPlayTime: number
  attendeeRegistration: string
  cost: number
  location: string
  roomName: string
  tableNumber: string
  specialCategory: string
  ticketsAvailable: number
  lastModified: string
  alsoRuns: string
  prize: string
  rulesComplexity: string
  originalOrder: number
}

export interface Event {
  id: string
  type: string
  attributes: EventAttributes
}

export interface EventSearchResponse {
  data: Event[]
  meta: { total: number }
  links: {
    self: string
    first?: string
    last?: string
    previous?: string
    next?: string
  }
  error: { status: string; detail: string } | null
}

/** URL search params — map directly to API query params. Ranges encoded as "[min,max]". */
export interface SearchParams {
  limit?: number
  page?: number
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
  sort?: string
}

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
