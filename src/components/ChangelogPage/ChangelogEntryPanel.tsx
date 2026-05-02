import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventListMobile } from "../../ui/EventTable/EventListMobile";
import { EventTable } from "../../ui/EventTable/EventTable";
import type { SharedColumnState } from "../../ui/EventTable/types";
import type { ChangelogEntry, Event } from "../../utils/types";
import styles from "./ChangelogEntryPanel.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
}

function EventGroup({
  events,
  sharedColumnState,
}: {
  events: Event[];
  sharedColumnState: SharedColumnState;
}): JSX.Element {
  return (
    <>
      <div className={styles.tableView}>
        <EventTable
          events={events}
          sharedColumnState={sharedColumnState}
          showColumnControls={false}
        />
      </div>
      <div className={styles.mobileView}>
        <EventListMobile
          events={events}
          typeDisplay={sharedColumnState.typeDisplay}
          showTypeIcon={sharedColumnState.showTypeIcon}
        />
      </div>
    </>
  );
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

  if (
    entry.createdEvents.length === 0 &&
    entry.updatedEvents.length === 0 &&
    entry.deletedEvents.length === 0
  ) {
    return (
      <EmptyState variant="empty" text="NO CHANGES" subtext="This entry has no event changes." />
    );
  }

  return (
    <div className={styles.panel}>
      {entry.createdEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          summary={
            <span>
              <span className={styles.groupVerb}>Created</span>{" "}
              <span className={styles.groupCount}>({entry.createdEvents.length})</span>
            </span>
          }
        >
          <EventGroup events={entry.createdEvents} sharedColumnState={sharedColumnState} />
        </AnimatedDetails>
      )}
      {entry.updatedEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          summary={
            <span>
              <span className={styles.groupVerb}>Updated</span>{" "}
              <span className={styles.groupCount}>({entry.updatedEvents.length})</span>
            </span>
          }
        >
          <EventGroup events={entry.updatedEvents} sharedColumnState={sharedColumnState} />
        </AnimatedDetails>
      )}
      {entry.deletedEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          summary={
            <span>
              <span className={styles.groupVerb}>Deleted</span>{" "}
              <span className={styles.groupCount}>({entry.deletedEvents.length})</span>
            </span>
          }
        >
          <EventGroup events={entry.deletedEvents} sharedColumnState={sharedColumnState} />
        </AnimatedDetails>
      )}
    </div>
  );
}
