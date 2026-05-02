import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Event } from "../../utils/types";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import styles from "./EventListMobile.module.css";

interface EventListMobileProps {
  events: Event[];
}

export function EventListMobile({ events }: EventListMobileProps): JSX.Element {
  return (
    <ul role="list" className={styles.list}>
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

        const TypeIcon = EVENT_TYPE_ICONS[a.eventType.split(" - ")[0]];
        return (
          <li key={event.id} className={styles.item}>
            <Link to="/event/$id" params={{ id: a.gameId }} className={styles.row}>
              <span className={styles.title}>{a.title}</span>
              <span className={styles.meta}>
                <span className={styles.typeTag}>
                  {TypeIcon && <TypeIcon size={14} />}
                  {a.eventType}
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
