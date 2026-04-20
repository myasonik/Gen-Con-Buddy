import { createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../components/SearchForm/SearchForm";
import { SearchResults } from "../components/SearchResults/SearchResults";
import { ActiveFilters } from "../ui/ActiveFilters/ActiveFilters";
import { useSidebarOpen } from "../hooks/useSidebarOpen";
import { buildSearchParams, parseSearchParams } from "../utils/searchParams";
import type { SearchFormValues, SearchParams } from "../utils/types";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (k: string) =>
      typeof search[k] === "string" ? (search[k] as string) : undefined;
    const num = (k: string) =>
      typeof search[k] === "number" ? (search[k] as number) : undefined;
    return {
      limit: num("limit"),
      page: num("page"),
      filter: str("filter"),
      gameId: str("gameId"),
      title: str("title"),
      eventType: str("eventType"),
      group: str("group"),
      shortDescription: str("shortDescription"),
      longDescription: str("longDescription"),
      gameSystem: str("gameSystem"),
      rulesEdition: str("rulesEdition"),
      minPlayers: str("minPlayers"),
      maxPlayers: str("maxPlayers"),
      ageRequired: str("ageRequired"),
      experienceRequired: str("experienceRequired"),
      materialsProvided: str("materialsProvided"),
      startDateTime: str("startDateTime"),
      duration: str("duration"),
      endDateTime: str("endDateTime"),
      gmNames: str("gmNames"),
      website: str("website"),
      email: str("email"),
      tournament: str("tournament"),
      roundNumber: str("roundNumber"),
      totalRounds: str("totalRounds"),
      minimumPlayTime: str("minimumPlayTime"),
      attendeeRegistration: str("attendeeRegistration"),
      cost: str("cost"),
      location: str("location"),
      roomName: str("roomName"),
      tableNumber: str("tableNumber"),
      specialCategory: str("specialCategory"),
      ticketsAvailable: str("ticketsAvailable"),
      lastModified: str("lastModified"),
      days: str("days"),
      sort: str("sort"),
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [sidebarOpen, toggleSidebar] = useSidebarOpen();

  const handleSearch = (values: SearchFormValues) => {
    void navigate({
      search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit }),
    });
  };

  const handleNavigate = (page: number, limit: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: page === 1 ? undefined : page,
        limit: limit === 100 ? undefined : limit,
      }),
    });
  };

  const handleSort = (sort: string | undefined) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort,
        page: undefined,
      }),
    });
  };

  const handleRemoveFilter = (key: keyof SearchParams) => {
    void navigate({
      search: (prev) => ({ ...prev, [key]: undefined }),
    });
  };

  return (
    <main className={styles.shell} data-sidebar-open={String(sidebarOpen)}>
      <div id="sidebar" className={styles.sidebar}>
        <SearchForm
          key={JSON.stringify(search)}
          defaultValues={parseSearchParams(search)}
          onSearch={handleSearch}
        />
      </div>
      <div className={styles.results}>
        <div className={styles.resultsToolbar}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            {sidebarOpen ? "◀ Filters" : "▶ Filters"}
          </button>
        </div>
        <ActiveFilters searchParams={search} onRemove={handleRemoveFilter} />
        <SearchResults
          searchParams={search}
          onNavigate={handleNavigate}
          onSort={handleSort}
        />
      </div>
    </main>
  );
}
