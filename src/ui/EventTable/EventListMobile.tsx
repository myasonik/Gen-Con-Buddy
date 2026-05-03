import React from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { COLUMN_VISIBILITY_DEFAULTS } from "../../hooks/useColumnVisibility";
import { EXP } from "../../utils/enums";
import type { Event } from "../../utils/types";
import { DescriptionItem, DescriptionList } from "../DescriptionList/DescriptionList";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import styles from "./EventListMobile.module.css";
import typeCellStyles from "./typeCell.module.css";
import type { TypeDisplay } from "./types";

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
  typeDisplay?: TypeDisplay;
  showTypeIcon?: boolean;
}

export function EventListMobile({
  events,
  visibility,
  typeDisplay,
  showTypeIcon,
}: EventListMobileProps): React.JSX.Element {
  const vis = visibility ?? COLUMN_VISIBILITY_DEFAULTS;
  const isVisible = (id: string): boolean => vis[id] !== false;

  const showTime = isVisible("day") || isVisible("startDateTime") || isVisible("endDateTime");
  const showMeta =
    isVisible("eventType") ||
    showTime ||
    isVisible("minPlayers") ||
    isVisible("maxPlayers") ||
    isVisible("ticketsAvailable");

  const typeDisplayAttr = typeDisplay === "code" || typeDisplay === "name" ? typeDisplay : undefined;
  const showIconAttr = showTypeIcon === false ? "false" : undefined;

  return (
    <ul
      role="list"
      className={styles.list}
      data-type-display={typeDisplayAttr}
      data-show-icon={showIconAttr}
    >
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

        const dashIdx = a.eventType.indexOf(" - ");
        const code = dashIdx !== -1 ? a.eventType.slice(0, dashIdx) : a.eventType;
        const name = dashIdx !== -1 ? a.eventType.slice(dashIdx + 3) : "";
        const TypeIcon = EVENT_TYPE_ICONS[code];

        let extraFields = EXTRA_COLUMN_IDS.filter((id) => isVisible(id))
          .map((id) => {
            const col = COL_BY_ID.get(id);
            const label = typeof col?.header === "string" ? col.header : id;
            const value = getMobileValue(id, a);
            return { id, label, value };
          })
          .filter(({ value }) => value !== "");

        if (
          extraFields.some((f) => f.id === "roundNumber") &&
          extraFields.some((f) => f.id === "totalRounds")
        ) {
          extraFields = extraFields
            .filter((f) => f.id !== "totalRounds")
            .map((f) =>
              f.id === "roundNumber"
                ? {
                    id: "roundNumber",
                    label: "Round",
                    value: `${a.roundNumber} out of ${a.totalRounds}`,
                  }
                : f,
            );
        }

        if (
          extraFields.some((f) => f.id === "minimumPlayTime") &&
          extraFields.some((f) => f.id === "duration")
        ) {
          extraFields = extraFields
            .filter((f) => f.id !== "minimumPlayTime")
            .map((f) =>
              f.id === "duration"
                ? {
                    id: "duration",
                    label: "Duration",
                    value: `${a.minimumPlayTime}h – ${a.duration}h`,
                  }
                : f,
            );
        }

        return (
          <li key={event.id} className={styles.item}>
            <Link to="/event/$id" params={{ id: a.gameId }} className={styles.row}>
              {isVisible("title") && <span className={styles.title}>{a.title}</span>}
              {showMeta && (
                <span className={styles.meta}>
                  {isVisible("eventType") && (
                    <span className={styles.typeTag}>
                      {TypeIcon && (
                        <span className={typeCellStyles.typeIcon}>
                          <TypeIcon size={16} />
                        </span>
                      )}
                      <span className={typeCellStyles.typeCode}>{code}</span>
                      {name && <span className={typeCellStyles.typeSep}> - </span>}
                      {name && <span className={typeCellStyles.typeName}>{name}</span>}
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
                <DescriptionList className={styles.mobileDetails}>
                  {extraFields.map(({ id, label, value }) => (
                    <DescriptionItem key={id} term={label}>
                      {value}
                    </DescriptionItem>
                  ))}
                </DescriptionList>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
