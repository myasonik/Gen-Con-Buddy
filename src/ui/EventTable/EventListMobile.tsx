import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Event } from "../../utils/types";
import { EXP } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import { COLUMN_VISIBILITY_DEFAULTS } from "../../hooks/useColumnVisibility";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import styles from "./EventListMobile.module.css";

const META_COLUMN_IDS = new Set([
  "eventType",
  "day",
  "startDateTime",
  "endDateTime",
  "minPlayers",
  "maxPlayers",
  "ticketsAvailable",
]);

const COL_BY_ID = new Map(
  COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id as string, c]),
);

const EXTRA_COLUMN_IDS = COLUMN_GROUPS.flatMap((g) => g.columnIds).filter(
  (id) => id !== "title" && !META_COLUMN_IDS.has(id),
);

function getMobileValue(id: string, a: Event["attributes"]): string {
  switch (id) {
    case "gameId":
      return a.gameId;
    case "group":
      return a.group;
    case "shortDescription":
      return a.shortDescription;
    case "longDescription":
      return a.longDescription;
    case "gameSystem":
      return a.gameSystem;
    case "rulesEdition":
      return a.rulesEdition;
    case "specialCategory":
      return a.specialCategory;
    case "ageRequired":
      return a.ageRequired;
    case "experienceRequired":
      return EXP[a.experienceRequired] ?? a.experienceRequired;
    case "tournament":
      return a.tournament;
    case "roundNumber":
      return String(a.roundNumber);
    case "totalRounds":
      return String(a.totalRounds);
    case "duration":
      return `${a.duration}h`;
    case "minimumPlayTime":
      return `${a.minimumPlayTime}h`;
    case "location":
      return a.location;
    case "roomName":
      return a.roomName;
    case "tableNumber":
      return a.tableNumber;
    case "cost":
      return `$${a.cost.toFixed(2)}`;
    case "attendeeRegistration":
      return a.attendeeRegistration;
    case "materialsProvided":
      return a.materialsProvided;
    case "materialsRequired":
      return a.materialsRequired;
    case "materialsRequiredDetails":
      return a.materialsRequiredDetails;
    case "gmNames":
      return a.gmNames;
    case "website":
      return a.website;
    case "email":
      return a.email;
    case "lastModified":
      return format(new Date(a.lastModified), "yyyy-MM-dd");
    default:
      return "";
  }
}

interface EventListMobileProps {
  events: Event[];
  visibility?: Partial<Record<string, boolean>>;
}

export function EventListMobile({ events, visibility }: EventListMobileProps): JSX.Element {
  const vis = visibility ?? COLUMN_VISIBILITY_DEFAULTS;
  const isVisible = (id: string): boolean => vis[id] !== false;

  const showTime = isVisible("day") || isVisible("startDateTime") || isVisible("endDateTime");
  const showMeta =
    isVisible("eventType") ||
    showTime ||
    isVisible("minPlayers") ||
    isVisible("maxPlayers") ||
    isVisible("ticketsAvailable");

  return (
    <ul role="list" className={styles.list}>
      {events.map((event) => {
        const a = event.attributes;
        const start = new Date(a.startDateTime);
        const end = new Date(a.endDateTime);

        let playersText: string | null = null;
        if (isVisible("minPlayers") && isVisible("maxPlayers")) {
          playersText =
            a.minPlayers === a.maxPlayers
              ? String(a.minPlayers)
              : `${a.minPlayers}–${a.maxPlayers}`;
        } else if (isVisible("minPlayers")) {
          playersText = String(a.minPlayers);
        } else if (isVisible("maxPlayers")) {
          playersText = String(a.maxPlayers);
        }

        const TypeIcon = EVENT_TYPE_ICONS[a.eventType.split(" - ")[0]];

        const extraFields = EXTRA_COLUMN_IDS.filter((id) => vis[id] === true)
          .map((id) => {
            const col = COL_BY_ID.get(id);
            const label = typeof col?.header === "string" ? col.header : id;
            const value = getMobileValue(id, a);
            return { id, label, value };
          })
          .filter(({ value }) => value !== "");

        return (
          <li key={event.id} className={styles.item}>
            <Link to="/event/$id" params={{ id: a.gameId }} className={styles.row}>
              {isVisible("title") && <span className={styles.title}>{a.title}</span>}
              {showMeta && (
                <span className={styles.meta}>
                  {isVisible("eventType") && (
                    <span className={styles.typeTag}>
                      {TypeIcon && <TypeIcon size={14} />}
                      {a.eventType}
                    </span>
                  )}
                  {showTime && (
                    <span className={styles.when}>
                      {isVisible("day") && format(start, "EEE")}
                      {isVisible("day") &&
                        (isVisible("startDateTime") || isVisible("endDateTime")) &&
                        " "}
                      {isVisible("startDateTime") && format(start, "HH:mm")}
                      {isVisible("startDateTime") && isVisible("endDateTime") && "–"}
                      {isVisible("endDateTime") && format(end, "HH:mm")}
                    </span>
                  )}
                  {playersText !== null && <span>{playersText}</span>}
                  {isVisible("ticketsAvailable") && (
                    <span className={a.ticketsAvailable === 0 ? styles.soldOut : undefined}>
                      {a.ticketsAvailable > 0
                        ? `${a.ticketsAvailable} ticket${a.ticketsAvailable !== 1 ? "s" : ""}`
                        : "Sold out"}
                    </span>
                  )}
                </span>
              )}
              {extraFields.length > 0 && (
                <dl className={styles.details}>
                  {extraFields.map(({ id, label, value }) => (
                    <div key={id} className={styles.detailRow}>
                      <dt className={styles.detailTerm}>{label}</dt>
                      <dd className={styles.detailValue}>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
