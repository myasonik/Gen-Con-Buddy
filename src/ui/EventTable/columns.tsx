import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { ConceptBadge } from "../Badge/Badge";
import { Pawn } from "../icons/Pawn";
import { EXP } from "../../utils/enums";
import type { Event } from "../../utils/types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
}

export const COLUMNS: ColumnDef<Event>[] = [
  {
    id: "gameId",
    header: "Game ID",
    meta: { sortField: "gameId" },
    cell: ({ row }) => {
      const { gameId } = row.original.attributes;
      return (
        <Link to="/event/$id" params={{ id: gameId }}>
          {gameId}
        </Link>
      );
    },
  },
  {
    id: "title",
    header: "Title",
    meta: { sortField: "title" },
    cell: ({ row }) => {
      const { gameId, title } = row.original.attributes;
      return (
        <Link to="/event/$id" params={{ id: gameId }}>
          {title}
        </Link>
      );
    },
  },
  {
    id: "eventType",
    header: "Type",
    meta: { sortField: "eventType" },
    cell: ({ row }) => (
      <ConceptBadge
        concept="eventType"
        value={row.original.attributes.eventType}
      />
    ),
  },
  {
    id: "group",
    header: "Group",
    meta: { sortField: "group" },
    cell: ({ row }) => <>{row.original.attributes.group}</>,
  },
  {
    id: "shortDescription",
    header: "Short Description",
    meta: { sortField: "shortDescription" },
    cell: ({ row }) => <>{row.original.attributes.shortDescription}</>,
  },
  {
    id: "longDescription",
    header: "Long Description",
    meta: { sortField: "longDescription" },
    cell: ({ row }) => <>{row.original.attributes.longDescription}</>,
  },
  {
    id: "gameSystem",
    header: "Game System",
    meta: { sortField: "gameSystem" },
    cell: ({ row }) => <>{row.original.attributes.gameSystem}</>,
  },
  {
    id: "rulesEdition",
    header: "Rules Edition",
    meta: { sortField: "rulesEdition" },
    cell: ({ row }) => <>{row.original.attributes.rulesEdition}</>,
  },
  {
    id: "minPlayers",
    header: "Min Players",
    meta: { sortField: "minPlayers" },
    cell: ({ row }) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Pawn aria-hidden="true" style={{ width: 10, height: 12 }} />
        {row.original.attributes.minPlayers}
      </span>
    ),
  },
  {
    id: "maxPlayers",
    header: "Max Players",
    meta: { sortField: "maxPlayers" },
    cell: ({ row }) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Pawn aria-hidden="true" style={{ width: 10, height: 12 }} />
        {row.original.attributes.maxPlayers}
      </span>
    ),
  },
  {
    id: "ageRequired",
    header: "Age Required",
    meta: { sortField: "ageRequired" },
    cell: ({ row }) => <>{row.original.attributes.ageRequired}</>,
  },
  {
    id: "experienceRequired",
    header: "Experience Required",
    meta: { sortField: "experienceRequired" },
    cell: ({ row }) => {
      const raw = row.original.attributes.experienceRequired;
      return (
        <ConceptBadge concept="experience" value={raw}>
          {EXP[raw] ?? raw}
        </ConceptBadge>
      );
    },
  },
  {
    id: "materialsProvided",
    header: "Materials Provided",
    meta: { sortField: "materialsProvided" },
    cell: ({ row }) => <>{row.original.attributes.materialsProvided}</>,
  },
  {
    id: "materialsRequired",
    header: "Materials Required",
    meta: { sortField: "materialsRequired" },
    cell: ({ row }) => <>{row.original.attributes.materialsRequired}</>,
  },
  {
    id: "materialsRequiredDetails",
    header: "Materials Required Details",
    meta: { sortField: "materialsRequiredDetails" },
    cell: ({ row }) => <>{row.original.attributes.materialsRequiredDetails}</>,
  },
  {
    id: "day",
    header: "Day",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => {
      const dayName = format(
        new Date(row.original.attributes.startDateTime),
        "EEEE",
      );
      return <ConceptBadge concept="day" value={dayName} />;
    },
  },
  {
    id: "startDateTime",
    header: "Start",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.startDateTime), "HH:mm")}</>
    ),
  },
  {
    id: "duration",
    header: "Duration",
    meta: { sortField: "duration" },
    cell: ({ row }) => <>{row.original.attributes.duration}</>,
  },
  {
    id: "endDateTime",
    header: "End",
    meta: { sortField: "endDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.endDateTime), "HH:mm")}</>
    ),
  },
  {
    id: "gmNames",
    header: "GMs",
    meta: { sortField: "gmNames" },
    cell: ({ row }) => <>{row.original.attributes.gmNames}</>,
  },
  {
    id: "website",
    header: "Website",
    meta: { sortField: "website" },
    cell: ({ row }) => <>{row.original.attributes.website}</>,
  },
  {
    id: "email",
    header: "Email",
    meta: { sortField: "email" },
    cell: ({ row }) => <>{row.original.attributes.email}</>,
  },
  {
    id: "tournament",
    header: "Tournament",
    meta: { sortField: "tournament" },
    cell: ({ row }) => <>{row.original.attributes.tournament}</>,
  },
  {
    id: "roundNumber",
    header: "Round Number",
    meta: { sortField: "roundNumber" },
    cell: ({ row }) => <>{row.original.attributes.roundNumber}</>,
  },
  {
    id: "totalRounds",
    header: "Total Rounds",
    meta: { sortField: "totalRounds" },
    cell: ({ row }) => <>{row.original.attributes.totalRounds}</>,
  },
  {
    id: "minimumPlayTime",
    header: "Min Time",
    meta: { sortField: "minimumPlayTime" },
    cell: ({ row }) => <>{row.original.attributes.minimumPlayTime}</>,
  },
  {
    id: "attendeeRegistration",
    header: "Attendee Registration",
    meta: { sortField: "attendeeRegistration" },
    cell: ({ row }) => <>{row.original.attributes.attendeeRegistration}</>,
  },
  {
    id: "cost",
    header: "Cost",
    meta: { sortField: "cost" },
    cell: ({ row }) => <>${row.original.attributes.cost.toFixed(2)}</>,
  },
  {
    id: "location",
    header: "Location",
    meta: { sortField: "location" },
    cell: ({ row }) => <>{row.original.attributes.location}</>,
  },
  {
    id: "roomName",
    header: "Room",
    meta: { sortField: "roomName" },
    cell: ({ row }) => <>{row.original.attributes.roomName}</>,
  },
  {
    id: "tableNumber",
    header: "Table Number",
    meta: { sortField: "tableNumber" },
    cell: ({ row }) => <>{row.original.attributes.tableNumber}</>,
  },
  {
    id: "specialCategory",
    header: "Special Category",
    meta: { sortField: "specialCategory" },
    cell: ({ row }) => <>{row.original.attributes.specialCategory}</>,
  },
  {
    id: "ticketsAvailable",
    header: "Tickets Available",
    meta: { sortField: "ticketsAvailable" },
    cell: ({ row }) => <>{row.original.attributes.ticketsAvailable}</>,
  },
  {
    id: "lastModified",
    header: "Last Modified",
    meta: { sortField: "lastModified" },
    cell: ({ row }) => (
      <>
        {format(new Date(row.original.attributes.lastModified), "yyyy-MM-dd")}
      </>
    ),
  },
];

export const SORT_FIELD_BY_COL_ID = new Map(
  COLUMNS.map((c) => [c.id!, c.meta?.sortField]),
);

export const COL_ID_BY_SORT_FIELD = new Map(
  COLUMNS.filter((c) => c.meta?.sortField).map((c) => [
    c.meta!.sortField!,
    c.id!,
  ]),
);
