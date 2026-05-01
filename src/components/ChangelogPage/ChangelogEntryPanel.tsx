import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { EventTable } from "../../ui/EventTable/EventTable";
import type { SharedColumnState } from "../../ui/EventTable/types";
import type { ChangelogEntry } from "../../utils/types";
import styles from "./ChangelogEntryPanel.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
}

export function ChangelogEntryPanel({
  entry,
  sharedColumnState,
}: ChangelogEntryPanelProps): JSX.Element {
  if (entry === undefined || entry === "loading") {
    return <p aria-busy="true">Loading…</p>;
  }

  if (entry === "error") {
    return <p>Could not load this entry. Collapse and re-expand to retry.</p>;
  }

  return (
    <div className={styles.panel}>
      {entry.createdEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          summary={`Created (${entry.createdEvents.length})`}
        >
          <EventTable
            events={entry.createdEvents}
            sharedColumnState={sharedColumnState}
            showColumnControls={false}
          />
        </AnimatedDetails>
      )}
      {entry.updatedEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          summary={`Updated (${entry.updatedEvents.length})`}
        >
          <EventTable
            events={entry.updatedEvents}
            sharedColumnState={sharedColumnState}
            showColumnControls={false}
          />
        </AnimatedDetails>
      )}
      {entry.deletedEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          summary={`Deleted (${entry.deletedEvents.length})`}
        >
          <EventTable
            events={entry.deletedEvents}
            sharedColumnState={sharedColumnState}
            showColumnControls={false}
          />
        </AnimatedDetails>
      )}
    </div>
  );
}
