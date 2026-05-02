import { createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../components/SearchForm/SearchForm";
import { SearchResults } from "../components/SearchResults/SearchResults";
import { ActiveFilters } from "../ui/ActiveFilters/ActiveFilters";
import { buildSearchParams, parseSearchParams } from "../utils/searchParams";
import { coerceSearchParams } from "../utils/coerceSearchParams";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import type { SearchFormValues, SearchParams } from "../utils/types";
import type { ActiveFilter } from "../ui/ActiveFilters/getActiveFilters";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => coerceSearchParams(search),
  component: SearchPage,
});

function SearchPage(): JSX.Element {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const handleSearch = (values: SearchFormValues): void => {
    void navigate({
      search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit }),
    });
  };

  const handleNavigate = (page: number, limit: number): void => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: page === 1 ? undefined : page,
        limit: limit === DEFAULT_PAGE_SIZE ? undefined : limit,
      }),
    });
  };

  const handleSort = (sort: string | undefined): void => {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort,
        page: undefined,
      }),
    });
  };

  const handleRemoveFilter = (filter: ActiveFilter): void => {
    void navigate({ search: (prev) => filter.remove(prev) });
  };

  return (
    <main className={styles.shell}>
      <SearchForm values={parseSearchParams(search)} onSearch={handleSearch} />
      <div className={styles.results}>
        <ActiveFilters searchParams={search} onRemove={handleRemoveFilter} />
        <SearchResults searchParams={search} onNavigate={handleNavigate} onSort={handleSort} />
      </div>
    </main>
  );
}
