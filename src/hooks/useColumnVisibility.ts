import { useStoredState } from "./useStoredState";

const STORAGE_KEY = "gen-con-buddy-columns";
const VERSION = 1;

export const COLUMN_VISIBILITY_DEFAULTS: Record<string, boolean> = {
  gameId: false,
  title: true,
  eventType: true,
  group: false,
  shortDescription: true,
  longDescription: false,
  gameSystem: false,
  rulesEdition: false,
  minPlayers: true,
  maxPlayers: true,
  ageRequired: false,
  experienceRequired: false,
  materialsProvided: false,
  materialsRequired: false,
  materialsRequiredDetails: false,
  day: true,
  startDateTime: true,
  duration: false,
  endDateTime: true,
  gmNames: false,
  website: false,
  email: false,
  tournament: false,
  roundNumber: false,
  totalRounds: false,
  minimumPlayTime: false,
  attendeeRegistration: false,
  cost: false,
  location: false,
  roomName: false,
  tableNumber: false,
  specialCategory: false,
  ticketsAvailable: true,
  lastModified: false,
};

export function useColumnVisibility(): {
  visibility: Record<string, boolean>;
  toggle: (column: string) => void;
  reset: () => void;
} {
  const [visibility, setVisibility] = useStoredState(STORAGE_KEY, VERSION, {
    ...COLUMN_VISIBILITY_DEFAULTS,
  });

  const toggle = (column: string): void => {
    setVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const reset = (): void => {
    setVisibility({ ...COLUMN_VISIBILITY_DEFAULTS });
  };

  return { visibility, toggle, reset };
}
