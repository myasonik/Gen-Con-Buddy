import type { NavigateFn } from "@tanstack/react-router";
import React, { startTransition, useMemo } from "react";
import { Collapsible } from "../../ui/Collapsible/Collapsible";
import { Chip } from "../../ui/Chip/Chip";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { filterChangelogEvents } from "../../utils/filterChangelogEvents";
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogEntry, Event, SortState } from "../../utils/types";
import { EventListMobile } from "../EventTable/EventListMobile";
import { EventTable } from "../EventTable/EventTable";
import type { SharedColumnState } from "../EventTable/types";
import styles from "./ChangelogEntryPanel.module.css";
import { parseOpenParam, serializeOpenParam } from "./openParam";
import { sortEventsMulti } from "../../utils/sortEventsMulti";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
  openParam?: string[];
  position?: number;
  navigate?: NavigateFn;
  activeFilter?: SearchFormValues;
  activeSort?: SortState[];
  onSort?: (sorts: SortState[]) => void;
  onOpenSortDrawer?: () => void;
}

const CHANGELOG_LINK_STATE = { from: "changelog" } as const;

function EventGroup({
  events,
  sharedColumnState,
  activeSort,
  onSort,
  onOpenSortDrawer,
}: {
  events: Event[];
  sharedColumnState: SharedColumnState;
  activeSort?: SortState[];
  onSort?: (sorts: SortState[]) => void;
  onOpenSortDrawer?: () => void;
}): React.JSX.Element {
  return (
    <>
      <div className={styles.tableView}>
        <EventTable
          events={events}
          sharedColumnState={sharedColumnState}
          linkState={CHANGELOG_LINK_STATE}
          activeSort={activeSort ?? []}
          onSort={onSort}
          onOpenSortDrawer={onOpenSortDrawer}
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
  activeFilter,
  activeSort,
  onSort,
  onOpenSortDrawer,
}: ChangelogEntryPanelProps): React.JSX.Element {
  const openForPosition = useMemo(
    () =>
      position !== undefined
        ? (parseOpenParam(openParam).get(position) ?? new Map<string, undefined>())
        : new Map<string, undefined>(),
    [openParam, position],
  );

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

  if (entry === undefined || entry === "loading") {
    return <p aria-busy="true">Loading…</p>;
  }

  if (entry === "error") {
    return <p>Could not load this entry. Collapse and re-expand to retry.</p>;
  }

  const hasAnyEvents =
    entry.createdEvents.length > 0 ||
    entry.updatedEvents.length > 0 ||
    entry.deletedEvents.length > 0;

  const createdEvents = activeFilter
    ? filterChangelogEvents(entry.createdEvents, activeFilter)
    : entry.createdEvents;
  const updatedEvents = activeFilter
    ? filterChangelogEvents(entry.updatedEvents, activeFilter)
    : entry.updatedEvents;
  const deletedEvents = activeFilter
    ? filterChangelogEvents(entry.deletedEvents, activeFilter)
    : entry.deletedEvents;

  if (createdEvents.length === 0 && updatedEvents.length === 0 && deletedEvents.length === 0) {
    if (hasAnyEvents && activeFilter) {
      return (
        <EmptyState
          variant="empty"
          text="NO MATCHES"
          subtext="No events match the current filters."
        />
      );
    }
    return (
      <EmptyState variant="empty" text="NO CHANGES" subtext="This entry has no event changes." />
    );
  }

  const groups = [
    {
      key: "created" as const,
      events: createdEvents,
      verbClass: styles.groupVerbCreated,
      label: "Created",
    },
    {
      key: "updated" as const,
      events: updatedEvents,
      verbClass: styles.groupVerbUpdated,
      label: "Updated",
    },
    {
      key: "deleted" as const,
      events: deletedEvents,
      verbClass: styles.groupVerbDeleted,
      label: "Deleted",
    },
  ];

  return (
    <div className={styles.panel}>
      {groups.map(({ key, events, verbClass, label }) => {
        if (events.length === 0) {
          return null;
        }
        return (
          <Collapsible
            key={key}
            className={styles.group}
            triggerClassName={styles.groupSummary}
            open={openForPosition.has(key)}
            onOpenChange={(open) => syncGroupToUrl(key, open)}
            trigger={
              <span>
                <span className={verbClass}>{label}</span>{" "}
                <Chip tone="neutral" className={styles.groupCount}>
                  {events.length}
                </Chip>
              </span>
            }
          >
            <EventGroup
              events={sortEventsMulti(events, activeSort ?? [])}
              sharedColumnState={sharedColumnState}
              activeSort={activeSort ?? []}
              onSort={onSort}
              onOpenSortDrawer={onOpenSortDrawer}
            />
          </Collapsible>
        );
      })}
    </div>
  );
}
