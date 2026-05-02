import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams } from "../../utils/types";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventTable } from "../../ui/EventTable/EventTable";
import { EventListMobile } from "../../ui/EventTable/EventListMobile";
import { ColumnControlsPanel } from "../../ui/EventTable/ColumnControlsPanel";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import styles from "./SearchResults.module.css";

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sort: string | undefined) => void;
}

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps): JSX.Element {
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const sharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
  };
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  let activeSortField: string | undefined = undefined;
  let activeSortDir: "asc" | "desc" | undefined = undefined;
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split(".");
    if (field && (dir === "asc" || dir === "desc")) {
      activeSortField = field;
      activeSortDir = dir;
    }
  }

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
        <EmptyState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
      )}
      {data && data.data.length > 0 && (
        <>
          <div className={styles.controlsBar}>
            <Pagination
              page={page}
              limit={limit}
              total={data.meta.total}
              onNavigate={onNavigate}
              aria-label="Pagination, top"
              singleLine
            />
          </div>
          <ColumnControlsPanel columnState={sharedColumnState} />
          <div className={styles.tableView}>
            <EventTable
              events={data.data}
              activeSortField={activeSortField}
              activeSortDir={activeSortDir}
              onSort={onSort}
              sharedColumnState={sharedColumnState}
              showColumnControls={false}
            />
          </div>
          <div className={styles.mobileView}>
            <EventListMobile events={data.data} />
          </div>
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
