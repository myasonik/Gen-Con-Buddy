import React from "react";
import { usePostHog } from "posthog-js/react";
import { createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../components/SearchForm/SearchForm";
import { SearchResults } from "../components/SearchResults/SearchResults";
import { ActiveFilters } from "../components/ActiveFilters/ActiveFilters";
import {
  coerceSearchParams,
  buildSearchParams,
  parseSearchParams,
  type SearchFormValues,
  type SearchParams,
} from "../utils/searchParamSchema";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import type { ActiveFilter } from "../components/ActiveFilters/getActiveFilters";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => coerceSearchParams(search),
  component: SearchPage,
});

function SearchPage(): React.JSX.Element {
  const posthog = usePostHog();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const handleSearch = (values: SearchFormValues): void => {
    void navigate({
      search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit, sort: prev.sort }),
    });
  };

  const handleNavigate = (page: number, limit: number): void => {
    const currentLimit = search.limit ?? DEFAULT_PAGE_SIZE;
    if (limit !== currentLimit) {
      posthog.capture("results_page_size_changed", {
        previous_limit: currentLimit,
        new_limit: limit,
      });
    } else {
      posthog.capture("results_page_changed", {
        page,
        limit,
      });
    }
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
    posthog.capture("filter_removed", {
      filter_id: filter.id,
      filter_label: filter.label,
    });
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
