import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams } from "../../utils/types";
import { PixelState } from "../../ui/PixelState/PixelState";
import { EventTable } from "../../ui/EventTable/EventTable";

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

  function renderPagination(ariaLabel: string): JSX.Element | null {
    if (!data || data.data.length === 0) {
      return null;
    }
    return (
      <Pagination
        page={page}
        limit={limit}
        total={data.meta.total}
        onNavigate={onNavigate}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <section>
      {isLoading && <PixelState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <PixelState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <PixelState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
      )}
      {data && data.data.length > 0 && (
        <>
          {renderPagination("Pagination, top")}
          <EventTable
            events={data.data}
            activeSortField={activeSortField}
            activeSortDir={activeSortDir}
            onSort={onSort}
          />
          {renderPagination("Pagination, bottom")}
        </>
      )}
    </section>
  );
}
