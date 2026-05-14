import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { EXP } from "../../utils/enums";
import type { Event } from "../../utils/types";
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { Chip } from "../../ui/Chip/Chip";
import styles from "./columns.module.css";
import typeCellStyles from "./typeCell.module.css";
import { formatDay, formatTime, toDisplayDate } from "../../utils/formatDay";
import type { DayFormat, TypeDisplay, TimeZone, TimeFormat } from "./types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
  interface CellContext<TData, TValue> {
    dayFormat: DayFormat;
    typeDisplay: TypeDisplay;
    showTypeIcon: boolean;
    linkState?: { from: string };
    timeZone: TimeZone;
    timeFormat: TimeFormat;
  }
}

export const COLUMNS: ColumnDef<Event>[] = [
  {
    id: "gameId",
    header: "Game ID",
    meta: { sortField: "gameId" },
    cell: ({ row, linkState }) => {
      const { gameId } = row.original.attributes;
      return (
        <Link
          to="/event/$id"
          params={{ id: gameId }}
          state={linkState}
          className={styles.gameIdLink}
        >
          {gameId}
        </Link>
      );
    },
  },
  {
    id: "title",
    header: "Title",
    meta: { sortField: "title" },
    cell: ({ row, linkState }) => {
      const { gameId, title } = row.original.attributes;
      return (
        <span className={styles.titleCell}>
          {STAFF_PICK_IDS.has(gameId) && (
            <Chip tone="accent" size="sm">
              Staff Pick
            </Chip>
          )}
          <Link to="/event/$id" params={{ id: gameId }} state={linkState}>
            {title}
          </Link>
        </span>
      );
    },
  },
  {
    id: "eventType",
    header: "Type",
    meta: { sortField: "eventType" },
    cell: ({ row, typeDisplay, showTypeIcon }) => {
      const { eventType } = row.original.attributes;
      const dashIdx = eventType.indexOf(" - ");
      const code = dashIdx !== -1 ? eventType.slice(0, dashIdx) : eventType;
      const name = dashIdx !== -1 ? eventType.slice(dashIdx + 3) : "";
      const Icon = EVENT_TYPE_ICONS[code];
      return (
        <span className={typeCellStyles.typeCell}>
          {showTypeIcon && Icon && (
            <span className={typeCellStyles.typeIcon}>
              <Icon size={16} />
            </span>
          )}
          {(typeDisplay === "code" || typeDisplay === "both") && (
            <span className={typeCellStyles.typeCode}>{code}</span>
          )}
          {typeDisplay === "both" && name && <span className={typeCellStyles.typeSep}> - </span>}
          {(typeDisplay === "name" || typeDisplay === "both") && name && (
            <span className={typeCellStyles.typeName}>{name}</span>
          )}
        </span>
      );
    },
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
    cell: ({ row }) => <>{row.original.attributes.minPlayers}</>,
  },
  {
    id: "maxPlayers",
    header: "Max Players",
    meta: { sortField: "maxPlayers" },
    cell: ({ row }) => <>{row.original.attributes.maxPlayers}</>,
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
      return <>{EXP[raw] ?? raw}</>;
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
    cell: ({ row, dayFormat, timeZone }) => (
      <>{formatDay(toDisplayDate(row.original.attributes.startDateTime, timeZone), dayFormat)}</>
    ),
  },
  {
    id: "startDateTime",
    header: "Start",
    meta: { sortField: "startDateTime" },
    cell: ({ row, timeZone, timeFormat }) => (
      <>{formatTime(toDisplayDate(row.original.attributes.startDateTime, timeZone), timeFormat)}</>
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
    cell: ({ row, timeZone, timeFormat }) => (
      <>{formatTime(toDisplayDate(row.original.attributes.endDateTime, timeZone), timeFormat)}</>
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
    cell: ({ row }) => {
      const n = row.original.attributes.ticketsAvailable;
      return n === 0 ? (
        <Chip tone="error" size="sm">
          Sold out
        </Chip>
      ) : (
        <>{n}</>
      );
    },
  },
  {
    id: "lastModified",
    header: "Last Modified",
    meta: { sortField: "lastModified" },
    cell: ({ row }) => <>{format(new Date(row.original.attributes.lastModified), "yyyy-MM-dd")}</>,
  },
];

export const COLUMN_GROUPS: { label: string; columnIds: string[] }[] = [
  {
    label: "The Event",
    columnIds: [
      "gameId",
      "title",
      "eventType",
      "group",
      "shortDescription",
      "longDescription",
      "gameSystem",
      "rulesEdition",
      "specialCategory",
    ],
  },
  {
    label: "Players",
    columnIds: [
      "minPlayers",
      "maxPlayers",
      "ageRequired",
      "experienceRequired",
      "tournament",
      "roundNumber",
      "totalRounds",
    ],
  },
  {
    label: "Logistics",
    columnIds: [
      "day",
      "startDateTime",
      "endDateTime",
      "duration",
      "minimumPlayTime",
      "location",
      "roomName",
      "tableNumber",
      "cost",
      "attendeeRegistration",
      "ticketsAvailable",
      "materialsProvided",
      "materialsRequired",
      "materialsRequiredDetails",
    ],
  },
  {
    label: "Contact",
    columnIds: ["gmNames", "website", "email", "lastModified"],
  },
];

export const SORT_FIELD_BY_COL_ID = new Map(
  COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id as string, c.meta?.sortField]),
);

export const COL_ID_BY_SORT_FIELD = new Map(
  COLUMNS.filter((c) => c.meta?.sortField && c.id !== undefined).map((c) => [
    c.meta?.sortField as string,
    c.id as string,
  ]),
);

export function getSortField(colId: string): string {
  const field = SORT_FIELD_BY_COL_ID.get(colId);
  if (field === undefined) {
    throw new Error(`Unknown column id: ${colId}`);
  }
  return field;
}

export function getColId(sortField: string): string {
  const colId = COL_ID_BY_SORT_FIELD.get(sortField);
  if (colId === undefined) {
    throw new Error(`Unknown sort field: ${sortField}`);
  }
  return colId;
}
