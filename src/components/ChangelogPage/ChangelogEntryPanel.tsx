import type { NavigateFn } from "@tanstack/react-router";
import React, { startTransition, useMemo } from "react";
import { Collapsible } from "../../ui/Collapsible/Collapsible";
import { Chip } from "../../ui/Chip/Chip";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { parseSortString } from "../../utils/parseSortString";
import { sortEvents } from "../../utils/sortEvents";
import { filterChangelogEvents } from "../../utils/filterChangelogEvents";
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogEntry, Event, SortState } from "../../utils/types";
import { EventListMobile } from "../EventTable/EventListMobile";
import { EventTable } from "../EventTable/EventTable";
import type { SharedColumnState } from "../EventTable/types";
import styles from "./ChangelogEntryPanel.module.css";
import { parseOpenParam, serializeOpenParam } from "./openParam";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
  openParam?: string[];
  position?: number;
  navigate?: NavigateFn;
  activeFilter?: SearchFormValues;
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
  activeFilter,
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
    return (s) => {
      if (s === undefined) {
        syncGroupSortToUrl(group, undefined);
      } else {
        const parsed = parseSortString(s);
        if (parsed) {
          syncGroupSortToUrl(group, parsed);
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
        const sort = openForPosition.get(key);
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
              events={sort ? sortEvents(events, sort.field, sort.dir) : events}
              sharedColumnState={sharedColumnState}
              onSort={makeOnSort(key)}
              activeSortField={sort?.field}
              activeSortDir={sort?.dir}
            />
          </Collapsible>
        );
      })}
    </div>
  );
}
