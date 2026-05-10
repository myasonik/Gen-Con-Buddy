import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { parseSorts } from "../../utils/parseSorts";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams } from "../../utils/searchParamSchema";
import type { SortState } from "../../utils/types";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventTable } from "../EventTable/EventTable";
import { EventListMobile } from "../EventTable/EventListMobile";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { FormatDrawer } from "../EventTable/FormatDrawer";
import { SortDrawer } from "../EventTable/SortDrawer";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { StaffPickCallout } from "../StaffPickCallout/StaffPickCallout";
import styles from "./SearchResults.module.css";

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sorts: SortState[]) => void;
}

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps): React.JSX.Element {
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const isMobile = useMediaQuery("(width <= 60rem)");
  const sharedColumnState = useSharedColumnState();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  const activeSort: SortState[] = searchParams.sort ? parseSorts(searchParams.sort) : [];
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false);

  return (
    <section>
      {isLoading && <EmptyState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <EmptyState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <>
          <EmptyState
            variant="empty"
            text="NO QUESTS FOUND"
            subtext="Try broadening your search."
          />
          <StaffPickCallout />
        </>
      )}
      {data && data.data.length > 0 && (
        <>
          <div className={styles.controlsBar}>
            <div className={styles.tableControls}>
              <VisibilityDrawer columnState={sharedColumnState} />
              <FormatDrawer columnState={sharedColumnState} />
              <SortDrawer
                activeSort={activeSort}
                onSort={onSort}
                columnVisibility={sharedColumnState.visibility}
                open={sortDrawerOpen}
                onOpenChange={setSortDrawerOpen}
              />
            </div>
            <Pagination
              page={page}
              limit={limit}
              total={data.meta.total}
              onNavigate={onNavigate}
              aria-label="Pagination, top"
              singleLine
            />
          </div>
          {!isMobile ? (
            <div className={styles.tableView}>
              <EventTable
                events={data.data}
                activeSort={activeSort}
                onSort={onSort}
                onOpenSortDrawer={() => setSortDrawerOpen(true)}
                sharedColumnState={sharedColumnState}
              />
            </div>
          ) : (
            <div className={styles.mobileView}>
              <div className={styles.mobileControls}>
                <VisibilityDrawer columnState={sharedColumnState} />
                <FormatDrawer columnState={sharedColumnState} />
                <SortDrawer
                  activeSort={activeSort}
                  onSort={onSort}
                  columnVisibility={sharedColumnState.visibility}
                  open={sortDrawerOpen}
                  onOpenChange={setSortDrawerOpen}
                />
              </div>
              <EventListMobile events={data.data} columnState={sharedColumnState} />
            </div>
          )}
          <Pagination
            page={page}
            limit={limit}
            total={data.meta.total}
            onNavigate={onNavigate}
            aria-label="Pagination, bottom"
          />
        </>
      )}
    </section>
  );
}
