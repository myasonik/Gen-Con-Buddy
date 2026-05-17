import type React from "react";
import { AGE_GROUPS, CATEGORY, EXP, EVENT_TYPES, REGISTRATION, YES_NO } from "./enums";
import { EVENT_TYPE_ICONS } from "../ui/icons/eventTypeIcons";
import { MagnifyingGlass } from "../ui/icons/MagnifyingGlass";
import { Calendar } from "../ui/icons/Calendar";
import { Hourglass } from "../ui/icons/Hourglass";
import { Meeple } from "../ui/icons/Meeple";
import { Coins } from "../ui/icons/Coins";
import { Ticket } from "../ui/icons/Ticket";
import { Trophy } from "../ui/icons/Trophy";
import { Ages } from "../ui/icons/Ages";
import { Skills } from "../ui/icons/Skills";
import { PositionMarker } from "../ui/icons/PositionMarker";
import { BeveledStar } from "../ui/icons/BeveledStar";
import { RuleBook } from "../ui/icons/RuleBook";
import { Backpack } from "../ui/icons/Backpack";
import type { FilterableKey } from "./searchParamSchema";

type IconComponent = React.ComponentType<{ size?: number | string }>;

type PlainDescriptor = {
  type: "plain";
  label: string;
  icon?: IconComponent;
};

type EnumDescriptor = {
  type: "enum";
  label: string;
  options: Record<string, string>;
  icon?: IconComponent;
};

type RangeDescriptor = {
  type: "range";
  label: string;
  suffix?: string;
  icon?: IconComponent;
};

type DateRangeDescriptor = {
  type: "dateRange";
  label: string;
  icon?: IconComponent;
};

type CostDescriptor = {
  type: "cost";
  icon?: IconComponent;
};

type MultiDescriptor = {
  type: "multi";
  options?: Record<string, string>;
  prefix: string;
  icon?: IconComponent;
  iconMap?: Record<string, IconComponent>;
};

type CombinedDescriptor = {
  type: "combined";
  group: string;
  icon?: IconComponent;
};

export type FieldDescriptor =
  | PlainDescriptor
  | EnumDescriptor
  | RangeDescriptor
  | DateRangeDescriptor
  | CostDescriptor
  | MultiDescriptor
  | CombinedDescriptor;

const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const FILTER_FIELDS = {
  filter: { type: "plain", label: "Search", icon: MagnifyingGlass },
  gameId: { type: "plain", label: "Game ID" },
  title: { type: "plain", label: "Title" },
  eventType: { type: "multi", options: EVENT_TYPES, prefix: "eventType", iconMap: EVENT_TYPE_ICONS },
  group: { type: "plain", label: "Group" },
  shortDescription: { type: "plain", label: "Short desc" },
  longDescription: { type: "plain", label: "Long desc" },
  gameSystem: { type: "multi", prefix: "gameSystem", icon: RuleBook },
  rulesEdition: { type: "plain", label: "Rules", icon: RuleBook },
  ageRequired: { type: "enum", label: "Age", options: AGE_GROUPS, icon: Ages },
  experienceRequired: { type: "enum", label: "Exp", options: EXP, icon: Skills },
  materialsProvided: { type: "plain", label: "Materials provided", icon: Backpack },
  materialsRequired: { type: "enum", label: "Materials required", options: YES_NO, icon: Backpack },
  materialsRequiredDetails: { type: "plain", label: "Materials details", icon: Backpack },
  days: { type: "multi", options: DAY_LABELS, prefix: "days", icon: Calendar },
  timeStart: { type: "combined", group: "timeRange", icon: Hourglass },
  timeEnd: { type: "combined", group: "timeRange" },
  duration: { type: "range", label: "Duration", suffix: "hrs", icon: Hourglass },
  minPlayers: { type: "range", label: "Min players", icon: Meeple },
  maxPlayers: { type: "range", label: "Max players", icon: Meeple },
  gmNames: { type: "plain", label: "GM" },
  website: { type: "plain", label: "Website" },
  email: { type: "plain", label: "Email" },
  tournament: { type: "enum", label: "Tournament", options: YES_NO, icon: Trophy },
  roundNumber: { type: "range", label: "Round" },
  totalRounds: { type: "range", label: "Total rounds" },
  minimumPlayTime: { type: "range", label: "Min play time", icon: Hourglass },
  attendeeRegistration: {
    type: "enum",
    label: "Registration",
    options: REGISTRATION,
    icon: Ticket,
  },
  cost: { type: "cost", icon: Coins },
  location: { type: "plain", label: "Location", icon: PositionMarker },
  roomName: { type: "plain", label: "Room", icon: PositionMarker },
  tableNumber: { type: "plain", label: "Table" },
  specialCategory: { type: "enum", label: "Category", options: CATEGORY, icon: BeveledStar },
  ticketsAvailable: { type: "range", label: "Tickets", icon: Ticket },
  lastModified: { type: "dateRange", label: "Modified", icon: Calendar },
} as const satisfies Record<FilterableKey, FieldDescriptor>;

/** Returns select-ready options for an enum field. */
export function enumOptions(key: FilterableKey): Array<{ value: string; label: string }> {
  const d = FILTER_FIELDS[key];
  if (d.type !== "enum") return [];
  return Object.entries(d.options).map(([value, label]) => ({ value, label }));
}
