import React, { startTransition, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogSummary, SortState } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../EventTable/types";
import { Collapsible } from "../../ui/Collapsible/Collapsible";
import { Chip } from "../../ui/Chip/Chip";
import { parseOpenParam, serializeOpenParam } from "./openParam";
import type { NavigateFn } from "@tanstack/react-router";
import { useChangelogEntryFilterState } from "./useChangelogEntryFilterState";
import styles from "./ChangelogRow.module.css";

interface ChangelogRowProps {
  position?: number;
  openParam?: string[];
  navigate?: NavigateFn;
  summary: ChangelogSummary;
  onOpen: () => void;
  sharedColumnState: SharedColumnState;
  activeFilter?: SearchFormValues;
  activeSort?: SortState[];
  onSort?: (sorts: SortState[]) => void;
  onOpenSortDrawer?: () => void;
}

export function ChangelogRow({
  position,
  openParam = [],
  navigate,
  summary,
  onOpen,
  sharedColumnState,
  activeFilter,
  activeSort: _activeSort,
  onSort: _onSort,
  onOpenSortDrawer: _onOpenSortDrawer,
}: ChangelogRowProps): React.JSX.Element {
  const openMap = parseOpenParam(openParam);
  const [isOpen, setIsOpen] = useState(() => position !== undefined && openMap.has(position));
  const { data: entry, isError } = useQuery({
    queryKey: ["changelog", "entry", summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  });

  const filterState = useChangelogEntryFilterState(summary.id, activeFilter);
  const isActive = filterState.kind === "active";
  let filterAttr: "unknown" | "dimmed" | undefined = undefined;
  if (filterState.kind === "unknown") {
    filterAttr = "unknown";
  } else if (isActive && !filterState.hasMatches) {
    filterAttr = "dimmed";
  }

  const createdCount = isActive ? filterState.filtered.created : summary.createdCount;
  const updatedCount = isActive ? filterState.filtered.updated : summary.updatedCount;
  const deletedCount = isActive ? filterState.filtered.deleted : summary.deletedCount;

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
    <div className={styles.rowWrapper} data-filter-state={filterAttr}>
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
              <Chip tone="jade">
                {isActive ? `${createdCount}/${summary.createdCount}` : createdCount} created
              </Chip>
              <Chip tone="cobalt">
                {isActive ? `${updatedCount}/${summary.updatedCount}` : updatedCount} updated
              </Chip>
              <Chip tone="amber">
                {isActive ? `${deletedCount}/${summary.deletedCount}` : deletedCount} deleted
              </Chip>
              {filterState.kind === "unknown" && (
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
