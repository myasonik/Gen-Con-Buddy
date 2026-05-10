import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EventTable } from "./EventTable";
import type { Event, SortState } from "../../utils/types";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { useDayFormat } from "../../hooks/useDayFormat";
import { useTimeZone } from "../../hooks/useTimeZone";
import { useTimeFormat } from "../../hooks/useTimeFormat";
import type { SharedColumnState } from "./types";

const makeEvent = (id: string, overrides: Partial<Event["attributes"]> = {}): Event => ({
  id,
  type: "event",
  attributes: {
    gameId: id,
    year: 2025,
    group: "Adventurers Guild",
    title: "The Lost Mines of Phandelver",
    shortDescription: "A classic starter adventure for 3-5 players.",
    longDescription: "",
    eventType: "RPG",
    gameSystem: "D&D 5e",
    rulesEdition: "5th",
    minPlayers: 3,
    maxPlayers: 5,
    ageRequired: "12+",
    experienceRequired: "None (Beginner)",
    materialsProvided: "Yes",
    materialsRequired: "No",
    materialsRequiredDetails: "",
    startDateTime: "2025-08-07T10:00:00",
    duration: 4,
    endDateTime: "2025-08-07T14:00:00",
    gmNames: "Alice Smith",
    website: "",
    email: "",
    tournament: "No",
    roundNumber: 0,
    totalRounds: 0,
    minimumPlayTime: 4,
    attendeeRegistration: "Preregistration Required",
    cost: 4,
    location: "ICC",
    roomName: "Hall A",
    tableNumber: "42",
    specialCategory: "",
    ticketsAvailable: 2,
    lastModified: "2025-06-01T00:00:00",
    alsoRuns: "",
    prize: "",
    rulesComplexity: "Low",
    originalOrder: 1,
    ...overrides,
  },
});

const SAMPLE_EVENTS: Event[] = [
  makeEvent("RPG-001"),
  makeEvent("RPG-002", {
    title: "Curse of Strahd",
    startDateTime: "2025-08-08T14:00:00",
    endDateTime: "2025-08-08T18:00:00",
    gmNames: "Bob Jones",
    ticketsAvailable: 0,
    cost: 6,
  }),
  makeEvent("BGM-001", {
    title: "Wingspan",
    eventType: "BGM",
    gameSystem: "Wingspan",
    rulesEdition: "Base",
    minPlayers: 1,
    maxPlayers: 5,
    startDateTime: "2025-08-09T09:00:00",
    endDateTime: "2025-08-09T11:00:00",
    gmNames: "Carol Lee",
    cost: 0,
    ticketsAvailable: 4,
  }),
];

interface EventTableStoryProps {
  events: Event[];
  activeSort?: SortState[];
  onSort?: (sorts: SortState[]) => void;
}

function EventTableStory({ events, activeSort, onSort }: EventTableStoryProps): React.JSX.Element {
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  const { timeZone, setTimeZone, reset: resetTimeZone } = useTimeZone();
  const { timeFormat, setTimeFormat, reset: resetTimeFormat } = useTimeFormat();
  const sharedColumnState: SharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
    timeZone,
    setTimeZone,
    resetTimeZone,
    timeFormat,
    setTimeFormat,
    resetTimeFormat,
  };
  return (
    <EventTable
      events={events}
      activeSort={activeSort}
      onSort={onSort}
      sharedColumnState={sharedColumnState}
    />
  );
}

const meta = {
  title: "UI/EventTable",
  component: EventTableStory,
  tags: ["autodocs"],
  args: {
    events: SAMPLE_EVENTS,
    onSort: (): void => {},
  },
} satisfies Meta<typeof EventTableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSort: Story = {
  args: {
    activeSort: [{ field: "title", dir: "asc" }],
  },
};

export const Empty: Story = {
  args: {
    events: [],
  },
};
