import type { ChangelogEntry } from "../../utils/types";
import { EventTable } from "../../ui/EventTable/EventTable";
import styles from "./ChangelogEntryPanel.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
}

export function ChangelogEntryPanel({ entry }: ChangelogEntryPanelProps) {
  if (entry === undefined || entry === "loading") {
    return (
      <p className={styles.status} aria-busy="true">
        Loading…
      </p>
    );
  }

  if (entry === "error") {
    return (
      <p className={styles.status}>
        Could not load this entry. Collapse and re-expand to retry.
      </p>
    );
  }

  return (
    <div className={styles.panel}>
      {entry.createdEvents.length > 0 && (
        <details open className={styles.group}>
          <summary>Created ({entry.createdEvents.length})</summary>
          <EventTable events={entry.createdEvents} />
        </details>
      )}
      {entry.updatedEvents.length > 0 && (
        <details open className={styles.group}>
          <summary>Updated ({entry.updatedEvents.length})</summary>
          <EventTable events={entry.updatedEvents} />
        </details>
      )}
      {entry.deletedEvents.length > 0 && (
        <details open className={styles.group}>
          <summary>Deleted ({entry.deletedEvents.length})</summary>
          <EventTable events={entry.deletedEvents} />
        </details>
      )}
    </div>
  );
}
