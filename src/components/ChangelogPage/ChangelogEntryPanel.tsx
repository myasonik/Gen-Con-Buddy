import React, { startTransition } from "react";
import type { NavigateFn } from "@tanstack/react-router";
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventListMobile } from "../EventTable/EventListMobile";
import { EventTable } from "../EventTable/EventTable";
import type { SharedColumnState } from "../EventTable/types";
import type { ChangelogEntry, Event } from "../../utils/types";
import { Chip } from "../../ui/Chip/Chip";
import { parseOpenParam, serializeOpenParam } from "./openParam";
import styles from "./ChangelogEntryPanel.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
  openParam?: string[];
  position?: number;
  navigate?: NavigateFn;
}

const CHANGELOG_LINK_STATE = { from: "changelog" } as const;

function EventGroup({
  events,
  sharedColumnState,
}: {
  events: Event[];
  sharedColumnState: SharedColumnState;
}): React.JSX.Element {
  return (
    <>
      <div className={styles.tableView}>
        <EventTable
          events={events}
          sharedColumnState={sharedColumnState}
          showColumnControls={false}
          linkState={CHANGELOG_LINK_STATE}
        />
      </div>
      <div className={styles.mobileView}>
        <EventListMobile
          events={events}
          typeDisplay={sharedColumnState.typeDisplay}
          showTypeIcon={sharedColumnState.showTypeIcon}
          dayFormat={sharedColumnState.dayFormat}
          linkState={CHANGELOG_LINK_STATE}
        />
      </div>
    </>
  );
}

export function ChangelogEntryPanel({
  entry,
  sharedColumnState,
  openParam = [],
  position,
  navigate,
}: ChangelogEntryPanelProps): React.JSX.Element {
  const openGroups: Set<string> =
    position !== undefined ? (parseOpenParam(openParam).get(position) ?? new Set()) : new Set();

  function syncGroupToUrl(group: string, nowOpen: boolean): void {
    if (!navigate || position === undefined) {
      return;
    }
    const newMap = new Map(parseOpenParam(openParam));
    // If the entry's position is absent from the map, the outer row was just closed
    // and this toggle is a React cleanup artifact — don't write back to the URL.
    if (!newMap.has(position)) {
      return;
    }
    const groups = new Set(newMap.get(position) ?? []);
    if (nowOpen) {
      groups.add(group);
    } else {
      groups.delete(group);
    }
    newMap.set(position, groups);
    startTransition(() => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, open: serializeOpenParam(newMap) }),
        replace: true,
      });
    });
  }
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
          open={openGroups.has("created")}
          onToggle={(e) => syncGroupToUrl("created", (e.currentTarget as HTMLDetailsElement).open)}
          summary={
            <span>
              <span className={styles.groupVerbCreated}>Created</span>{" "}
              <Chip tone="neutral" className={styles.groupCount}>
                ({entry.createdEvents.length})
              </Chip>
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
          open={openGroups.has("updated")}
          onToggle={(e) => syncGroupToUrl("updated", (e.currentTarget as HTMLDetailsElement).open)}
          summary={
            <span>
              <span className={styles.groupVerbUpdated}>Updated</span>{" "}
              <Chip tone="neutral" className={styles.groupCount}>
                ({entry.updatedEvents.length})
              </Chip>
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
          open={openGroups.has("deleted")}
          onToggle={(e) => syncGroupToUrl("deleted", (e.currentTarget as HTMLDetailsElement).open)}
          summary={
            <span>
              <span className={styles.groupVerbDeleted}>Deleted</span>{" "}
              <Chip tone="neutral" className={styles.groupCount}>
                ({entry.deletedEvents.length})
              </Chip>
            </span>
          }
        >
          <EventGroup events={entry.deletedEvents} sharedColumnState={sharedColumnState} />
        </AnimatedDetails>
      )}
    </div>
  );
}
