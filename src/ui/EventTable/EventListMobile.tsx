import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Event } from "../../utils/types";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import { COLUMN_VISIBILITY_DEFAULTS } from "../../hooks/useColumnVisibility";
import styles from "./EventListMobile.module.css";

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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
