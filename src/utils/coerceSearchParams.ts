import type { SearchParams } from "./types";

export function coerceSearchParams(raw: Record<string, unknown>): SearchParams {
  const str = (k: string): string | undefined =>
    typeof raw[k] === "string" ? (raw[k] as string) : undefined;
  const num = (k: string): number | undefined =>
    typeof raw[k] === "number" ? (raw[k] as number) : undefined;

  return {
    limit: num("limit"),
    page: num("page"),
    filter: str("filter"),
    gameId: str("gameId"),
    title: str("title"),
    eventType: str("eventType"),
    group: str("group"),
    shortDescription: str("shortDescription"),
    longDescription: str("longDescription"),
    gameSystem: str("gameSystem"),
    rulesEdition: str("rulesEdition"),
    minPlayers: str("minPlayers"),
    maxPlayers: str("maxPlayers"),
    ageRequired: str("ageRequired"),
    experienceRequired: str("experienceRequired"),
    materialsProvided: str("materialsProvided"),
    materialsRequired: str("materialsRequired"),
    materialsRequiredDetails: str("materialsRequiredDetails"),
    startDateTime: str("startDateTime"),
    duration: str("duration"),
    endDateTime: str("endDateTime"),
    gmNames: str("gmNames"),
    website: str("website"),
    email: str("email"),
    tournament: str("tournament"),
    roundNumber: str("roundNumber"),
    totalRounds: str("totalRounds"),
    minimumPlayTime: str("minimumPlayTime"),
    attendeeRegistration: str("attendeeRegistration"),
    cost: str("cost"),
    location: str("location"),
    roomName: str("roomName"),
    tableNumber: str("tableNumber"),
    specialCategory: str("specialCategory"),
    ticketsAvailable: str("ticketsAvailable"),
    lastModified: str("lastModified"),
    days: str("days"),
    timeStart: str("timeStart"),
    timeEnd: str("timeEnd"),
    sort: str("sort"),
  };
}
