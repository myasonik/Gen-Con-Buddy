import React, { startTransition, useMemo } from "react";
import type { NavigateFn } from "@tanstack/react-router";
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventListMobile } from "../EventTable/EventListMobile";
import { EventTable } from "../EventTable/EventTable";
import type { SharedColumnState } from "../EventTable/types";
import type { ChangelogEntry, Event } from "../../utils/types";
import { Chip } from "../../ui/Chip/Chip";
import { parseOpenParam, serializeOpenParam, type SortState } from "./openParam";
import { sortEvents } from "../../utils/sortEvents";
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
  onSort,
  activeSortField,
  activeSortDir,
}: {
  events: Event[];
  sharedColumnState: SharedColumnState;
  onSort?: (sort: string | undefined) => void;
  activeSortField?: string;
  activeSortDir?: "asc" | "desc";
}): React.JSX.Element {
  return (
    <>
      <div className={styles.tableView}>
        <EventTable
          events={events}
          sharedColumnState={sharedColumnState}
          showColumnControls={false}
          linkState={CHANGELOG_LINK_STATE}
          onSort={onSort}
          activeSortField={activeSortField}
          activeSortDir={activeSortDir}
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
  const openForPosition = useMemo(
    () =>
      position !== undefined
        ? (parseOpenParam(openParam).get(position) ?? new Map<string, SortState | undefined>())
        : new Map<string, SortState | undefined>(),
    [openParam, position],
  );

  function syncGroupSortToUrl(group: string, sort: SortState | undefined): void {
    if (!navigate || position === undefined) {
      return;
    }
    startTransition(() => {
      void navigate({
        to: ".",
        search: (prev) => {
          const openMap = new Map(parseOpenParam(prev.open ?? []));
          // If the entry's position is absent from the map, the outer row was just closed;
          // don't write back to the URL.
          if (!openMap.has(position)) {
            return prev;
          }
          const groupMap = new Map(openMap.get(position) ?? []);
          groupMap.set(group, sort);
          openMap.set(position, groupMap);
          return { ...prev, open: serializeOpenParam(openMap) };
        },
        replace: true,
        resetScroll: false,
      });
    });
  }

  function syncGroupToUrl(group: string, nowOpen: boolean): void {
    if (!navigate || position === undefined) {
      return;
    }
    startTransition(() => {
      void navigate({
        to: ".",
        search: (prev) => {
          const newOpenMap = new Map(parseOpenParam(prev.open ?? []));
          if (!newOpenMap.has(position)) {
            return prev;
          }
          const groups = new Map(newOpenMap.get(position) ?? []);
          if (nowOpen) {
            if (!groups.has(group)) {
              groups.set(group, undefined);
            }
          } else {
            groups.delete(group);
          }
          newOpenMap.set(position, groups);
          return { ...prev, open: serializeOpenParam(newOpenMap) };
        },
        replace: true,
        resetScroll: false,
      });
    });
  }

  function makeOnSort(group: string): (s: string | undefined) => void {
    // EventTable only calls onSort with strings it constructs as `${field}.${dir}`;
    // malformed values are silently ignored.
    return (s) => {
      if (s === undefined) {
        syncGroupSortToUrl(group, undefined);
      } else {
        const [field, dir] = s.split(".");
        if (field && (dir === "asc" || dir === "desc")) {
          syncGroupSortToUrl(group, { field, dir });
        }
      }
    };
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

  const createdSort = openForPosition.get("created");
  const updatedSort = openForPosition.get("updated");
  const deletedSort = openForPosition.get("deleted");

  return (
    <div className={styles.panel}>
      {entry.createdEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          open={openForPosition.has("created")}
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
          <EventGroup
            events={
              createdSort
                ? sortEvents(entry.createdEvents, createdSort.field, createdSort.dir)
                : entry.createdEvents
            }
            sharedColumnState={sharedColumnState}
            onSort={makeOnSort("created")}
            activeSortField={createdSort?.field}
            activeSortDir={createdSort?.dir}
          />
        </AnimatedDetails>
      )}
      {entry.updatedEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          open={openForPosition.has("updated")}
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
          <EventGroup
            events={
              updatedSort
                ? sortEvents(entry.updatedEvents, updatedSort.field, updatedSort.dir)
                : entry.updatedEvents
            }
            sharedColumnState={sharedColumnState}
            onSort={makeOnSort("updated")}
            activeSortField={updatedSort?.field}
            activeSortDir={updatedSort?.dir}
          />
        </AnimatedDetails>
      )}
      {entry.deletedEvents.length > 0 && (
        <AnimatedDetails
          className={styles.group}
          summaryClassName={styles.groupSummary}
          open={openForPosition.has("deleted")}
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
          <EventGroup
            events={
              deletedSort
                ? sortEvents(entry.deletedEvents, deletedSort.field, deletedSort.dir)
                : entry.deletedEvents
            }
            sharedColumnState={sharedColumnState}
            onSort={makeOnSort("deleted")}
            activeSortField={deletedSort?.field}
            activeSortDir={deletedSort?.dir}
          />
        </AnimatedDetails>
      )}
    </div>
  );
}
