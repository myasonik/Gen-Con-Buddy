import React, { startTransition, useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangelogEntry, ChangelogSummary, SearchFormValues } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../EventTable/types";
import { Collapsible } from "../../ui/Collapsible/Collapsible";
import { Chip } from "../../ui/Chip/Chip";
import { parseOpenParam, serializeOpenParam } from "./openParam";
import type { NavigateFn } from "@tanstack/react-router";
import { filterChangelogEvents } from "../../utils/filterChangelogEvents";
import styles from "./ChangelogRow.module.css";

interface ChangelogRowProps {
  position?: number;
  openParam?: string[];
  navigate?: NavigateFn;
  summary: ChangelogSummary;
  onOpen: () => void;
  sharedColumnState: SharedColumnState;
  activeFilter?: SearchFormValues;
}

function isFilterActive(filter: SearchFormValues | undefined): boolean {
  if (!filter) {
    return false;
  }
  return Boolean(filter.eventType || filter.days || filter.timeStart || filter.timeEnd);
}

function computeFilterState(
  filterActive: boolean,
  cachedEntry: ChangelogEntry | undefined,
  filteredCounts: { hasMatches: boolean } | null,
): "dimmed" | "unknown" | undefined {
  if (!filterActive) {
    return undefined;
  }
  if (cachedEntry === undefined) {
    return "unknown";
  }
  if (filteredCounts?.hasMatches) {
    return undefined;
  }
  return "dimmed";
}

function deriveFilteredCounts(
  cachedEntry: ChangelogEntry,
  activeFilter: SearchFormValues,
): { createdCount: number; updatedCount: number; deletedCount: number; hasMatches: boolean } {
  const filteredCreated = filterChangelogEvents(cachedEntry.createdEvents, activeFilter);
  const filteredUpdated = filterChangelogEvents(cachedEntry.updatedEvents, activeFilter);
  const filteredDeleted = filterChangelogEvents(cachedEntry.deletedEvents, activeFilter);
  return {
    createdCount: filteredCreated.length,
    updatedCount: filteredUpdated.length,
    deletedCount: filteredDeleted.length,
    hasMatches:
      filteredCreated.length > 0 || filteredUpdated.length > 0 || filteredDeleted.length > 0,
  };
}

export function ChangelogRow({
  position,
  openParam = [],
  navigate,
  summary,
  onOpen,
  sharedColumnState,
  activeFilter,
}: ChangelogRowProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const openMap = parseOpenParam(openParam);
  const [isOpen, setIsOpen] = useState(() => position !== undefined && openMap.has(position));
  const { data: entry, isError } = useQuery({
    queryKey: ["changelog", "entry", summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  });

  const filterActive = isFilterActive(activeFilter);
  const cachedEntry = queryClient.getQueryData<ChangelogEntry>(["changelog", "entry", summary.id]);

  const filteredCounts =
    filterActive && cachedEntry !== undefined && activeFilter !== undefined
      ? deriveFilteredCounts(cachedEntry, activeFilter)
      : null;

  const filterState = computeFilterState(filterActive, cachedEntry, filteredCounts);

  const createdCount = filteredCounts !== null ? filteredCounts.createdCount : summary.createdCount;
  const updatedCount = filteredCounts !== null ? filteredCounts.updatedCount : summary.updatedCount;
  const deletedCount = filteredCounts !== null ? filteredCounts.deletedCount : summary.deletedCount;

  function syncOpenToUrl(nowOpen: boolean): void {
    if (!navigate || position === undefined) {
      return;
    }
    const newMap = new Map(openMap);
    if (nowOpen) {
      newMap.set(position, newMap.get(position) ?? new Map());
    } else {
      newMap.delete(position);
    }
    startTransition(() => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, open: serializeOpenParam(newMap) }),
        replace: true,
        resetScroll: false,
      });
    });
  }

  return (
    <div className={styles.rowWrapper} data-filter-state={filterState}>
      <Collapsible
        className={styles.row}
        triggerClassName={styles.summary}
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          syncOpenToUrl(open);
          if (open) {
            onOpen();
          }
        }}
        trigger={
          <>
            <time dateTime={summary.date} className={styles.date}>
              {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
            </time>
            <span className={styles.counts}>
              <Chip tone="jade">{createdCount} created</Chip>
              <Chip tone="cobalt">{updatedCount} updated</Chip>
              <Chip tone="amber">{deletedCount} deleted</Chip>
              {filterState === "unknown" && (
                <span className={styles.unknownBadge} aria-label="Filter match unknown">
                  ?
                </span>
              )}
            </span>
          </>
        }
      >
        <ChangelogEntryPanel
          entry={isError ? "error" : entry}
          sharedColumnState={sharedColumnState}
          openParam={openParam}
          position={position}
          navigate={navigate}
          activeFilter={activeFilter}
        />
      </Collapsible>
    </div>
  );
}
