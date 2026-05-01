import type { Meta, StoryObj } from "@storybook/react-vite";
import { EventTable } from "./EventTable";
import type { Event } from "../../utils/types";

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

const meta = {
  title: "UI/EventTable",
  component: EventTable,
  tags: ["autodocs"],
  args: {
    events: SAMPLE_EVENTS,
    onSort: (): void => {},
  },
} satisfies Meta<typeof EventTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSort: Story = {
  args: {
    activeSortField: "title",
    activeSortDir: "asc",
  },
};

export const NoColumnControls: Story = {
  args: {
    showColumnControls: false,
  },
};

export const Empty: Story = {
  args: {
    events: [],
  },
};
