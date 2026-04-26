import type {
  Event,
  ChangelogSummary,
  ChangelogEntry,
} from "../../utils/types";

let counter = 0;

export function makeEvent(overrides: Partial<Event["attributes"]> = {}): Event {
  counter++;
  return {
    id: String(counter),
    type: "events",
    attributes: {
      gameId: `RPG24${String(counter).padStart(6, "0")}`,
      year: 2024,
      group: "Test Group",
      title: "Test Event",
      shortDescription: "A short description.",
      longDescription: "A longer description.",
      eventType: "RPG",
      gameSystem: "D&D",
      rulesEdition: "5e",
      minPlayers: 2,
      maxPlayers: 6,
      ageRequired: "everyone",
      experienceRequired: "none",
      materialsProvided: "Yes",
      materialsRequired: "No",
      materialsRequiredDetails: "",
      startDateTime: "2024-08-01T10:00:00Z",
      duration: 4,
      endDateTime: "2024-08-01T14:00:00Z",
      gmNames: "Jane Smith",
      website: "",
      email: "",
      tournament: "No",
      roundNumber: 1,
      totalRounds: 1,
      minimumPlayTime: 4,
      attendeeRegistration: "open",
      cost: 4,
      location: "ICC",
      roomName: "Hall A",
      tableNumber: "1",
      specialCategory: "none",
      ticketsAvailable: 3,
      lastModified: "2024-01-01T00:00:00Z",
      alsoRuns: "",
      prize: "",
      rulesComplexity: "Medium",
      originalOrder: counter,
      ...overrides,
    },
  };
}

export function makeChangelogSummary(
  overrides: Partial<ChangelogSummary> = {},
): ChangelogSummary {
  counter++;
  return {
    id: `entry-${counter}`,
    date: "2026-04-25T12:00:00Z",
    createdCount: 2,
    updatedCount: 1,
    deletedCount: 0,
    ...overrides,
  };
}

export function makeChangelogEntry(
  overrides: Partial<ChangelogEntry> = {},
): ChangelogEntry {
  const base: ChangelogEntry = {
    id: `entry-${counter}`,
    date: "2026-04-25T12:00:00Z",
    createdEvents: [makeEvent()],
    updatedEvents: [],
    deletedEvents: [],
  };
  return { ...base, ...overrides };
}
