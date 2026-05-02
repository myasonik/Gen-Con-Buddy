import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Event } from "../../utils/types";
import type { TypeDisplay } from "./types";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import typeCellStyles from "./typeCell.module.css";
import styles from "./EventListMobile.module.css";

interface EventListMobileProps {
  events: Event[];
  typeDisplay?: TypeDisplay;
  showTypeIcon?: boolean;
}

export function EventListMobile({
  events,
  typeDisplay,
  showTypeIcon,
}: EventListMobileProps): JSX.Element {
  let textClass: string | undefined = undefined;
  if (typeDisplay === "code") {
    textClass = typeCellStyles.typeDisplayCode;
  } else if (typeDisplay === "name") {
    textClass = typeCellStyles.typeDisplayName;
  }
  const iconClass = showTypeIcon === false ? typeCellStyles.typeHideIcon : undefined;
  const modeClass = [textClass, iconClass].filter(Boolean).join(" ") || undefined;

  return (
    <ul role="list" className={[styles.list, modeClass].filter(Boolean).join(" ")}>
      {events.map((event) => {
        const a = event.attributes;
        const start = new Date(a.startDateTime);
        const end = new Date(a.endDateTime);
        const players =
          a.minPlayers === a.maxPlayers ? String(a.minPlayers) : `${a.minPlayers}–${a.maxPlayers}`;
        const tickets =
          a.ticketsAvailable > 0
            ? `${a.ticketsAvailable} ticket${a.ticketsAvailable !== 1 ? "s" : ""}`
            : "Sold out";
        const TypeIcon = EVENT_TYPE_ICONS[a.eventType];
        const fullLabel = EVENT_TYPES[a.eventType] ?? a.eventType;
        const name = fullLabel.startsWith(`${a.eventType} - `)
          ? fullLabel.slice(a.eventType.length + 3)
          : "";
        return (
          <li key={event.id} className={styles.item}>
            <Link to="/event/$id" params={{ id: a.gameId }} className={styles.row}>
              <span className={styles.title}>{a.title}</span>
              <span className={styles.meta}>
                <span className={styles.typeTag}>
                  {TypeIcon && (
                    <span className={typeCellStyles.typeIcon}>
                      <TypeIcon size={14} />
                    </span>
                  )}
                  <span className={typeCellStyles.typeCode}>{a.eventType}</span>
                  {name && <span className={typeCellStyles.typeSep}> - </span>}
                  {name && <span className={typeCellStyles.typeName}>{name}</span>}
                </span>
                <span className={styles.when}>
                  {format(start, "EEE")} {format(start, "HH:mm")}–{format(end, "HH:mm")}
                </span>
                <span>{players}</span>
                <span className={a.ticketsAvailable === 0 ? styles.soldOut : undefined}>
                  {tickets}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
