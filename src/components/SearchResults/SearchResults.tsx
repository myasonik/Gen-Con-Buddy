import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import { announce } from "../../lib/announce";
import type { SearchParams, Event } from "../../utils/types";
import { PixelState } from "../../ui/PixelState/PixelState";
import { ConceptBadge } from "../../ui/Badge/Badge";
import { Pawn } from "../../ui/icons/Pawn";
import { DAY_COLORS } from "../../utils/conceptColors";
import { EXP } from "../../utils/enums";
import styles from "./SearchResults.module.css";

// Extend TanStack Table's ColumnMeta to include our sortField
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
}

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sort: string | undefined) => void;
}

const COLUMNS: ColumnDef<Event>[] = [
  {
    id: "dayStripe",
    header: () => null,
    cell: () => null, // rendered specially in the row loop
  },
  {
    id: "gameId",
    header: "Game ID",
    meta: { sortField: "gameId" },
    cell: ({ row }) => {
      const { gameId } = row.original.attributes;
      return (
        <Link to="/event/$id" params={{ id: gameId }}>
          {gameId}
        </Link>
      );
    },
  },
  {
    id: "title",
    header: "Title",
    meta: { sortField: "title" },
    cell: ({ row }) => {
      const { gameId, title } = row.original.attributes;
      return (
        <Link to="/event/$id" params={{ id: gameId }}>
          {title}
        </Link>
      );
    },
  },
  {
    id: "eventType",
    header: "Type",
    meta: { sortField: "eventType" },
    cell: ({ row }) => (
      <ConceptBadge
        concept="eventType"
        value={row.original.attributes.eventType}
      />
    ),
  },
  {
    id: "group",
    header: "Group",
    meta: { sortField: "group" },
    cell: ({ row }) => <>{row.original.attributes.group}</>,
  },
  {
    id: "shortDescription",
    header: "Short Description",
    meta: { sortField: "shortDescription" },
    cell: ({ row }) => <>{row.original.attributes.shortDescription}</>,
  },
  {
    id: "longDescription",
    header: "Long Description",
    meta: { sortField: "longDescription" },
    cell: ({ row }) => <>{row.original.attributes.longDescription}</>,
  },
  {
    id: "gameSystem",
    header: "Game System",
    meta: { sortField: "gameSystem" },
    cell: ({ row }) => <>{row.original.attributes.gameSystem}</>,
  },
  {
    id: "rulesEdition",
    header: "Rules Edition",
    meta: { sortField: "rulesEdition" },
    cell: ({ row }) => <>{row.original.attributes.rulesEdition}</>,
  },
  {
    id: "minPlayers",
    header: "Min Players",
    meta: { sortField: "minPlayers" },
    cell: ({ row }) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Pawn
          aria-hidden="true"
          style={{ width: 10, height: 12, color: "var(--color-bark-light)" }}
        />
        {row.original.attributes.minPlayers}
      </span>
    ),
  },
  {
    id: "maxPlayers",
    header: "Max Players",
    meta: { sortField: "maxPlayers" },
    cell: ({ row }) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Pawn
          aria-hidden="true"
          style={{ width: 10, height: 12, color: "var(--color-bark-light)" }}
        />
        {row.original.attributes.maxPlayers}
      </span>
    ),
  },
  {
    id: "ageRequired",
    header: "Age Required",
    meta: { sortField: "ageRequired" },
    cell: ({ row }) => <>{row.original.attributes.ageRequired}</>,
  },
  {
    id: "experienceRequired",
    header: "Experience Required",
    meta: { sortField: "experienceRequired" },
    cell: ({ row }) => {
      const raw = row.original.attributes.experienceRequired;
      return (
        <ConceptBadge concept="experience" value={raw}>
          {EXP[raw] ?? raw}
        </ConceptBadge>
      );
    },
  },
  {
    id: "materialsProvided",
    header: "Materials Provided",
    meta: { sortField: "materialsProvided" },
    cell: ({ row }) => <>{row.original.attributes.materialsProvided}</>,
  },
  {
    id: "materialsRequired",
    header: "Materials Required",
    meta: { sortField: "materialsRequired" },
    cell: ({ row }) => <>{row.original.attributes.materialsRequired}</>,
  },
  {
    id: "materialsRequiredDetails",
    header: "Materials Required Details",
    meta: { sortField: "materialsRequiredDetails" },
    cell: ({ row }) => <>{row.original.attributes.materialsRequiredDetails}</>,
  },
  {
    id: "day",
    header: "Day",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => {
      const dayName = format(
        new Date(row.original.attributes.startDateTime),
        "EEEE",
      );
      return <ConceptBadge concept="day" value={dayName} />;
    },
  },
  {
    id: "startDateTime",
    header: "Start",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.startDateTime), "HH:mm")}</>
    ),
  },
  {
    id: "duration",
    header: "Duration",
    meta: { sortField: "duration" },
    cell: ({ row }) => <>{row.original.attributes.duration}</>,
  },
  {
    id: "endDateTime",
    header: "End",
    meta: { sortField: "endDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.endDateTime), "HH:mm")}</>
    ),
  },
  {
    id: "gmNames",
    header: "GMs",
    meta: { sortField: "gmNames" },
    cell: ({ row }) => <>{row.original.attributes.gmNames}</>,
  },
  {
    id: "website",
    header: "Website",
    meta: { sortField: "website" },
    cell: ({ row }) => <>{row.original.attributes.website}</>,
  },
  {
    id: "email",
    header: "Email",
    meta: { sortField: "email" },
    cell: ({ row }) => <>{row.original.attributes.email}</>,
  },
  {
    id: "tournament",
    header: "Tournament",
    meta: { sortField: "tournament" },
    cell: ({ row }) => <>{row.original.attributes.tournament}</>,
  },
  {
    id: "roundNumber",
    header: "Round Number",
    meta: { sortField: "roundNumber" },
    cell: ({ row }) => <>{row.original.attributes.roundNumber}</>,
  },
  {
    id: "totalRounds",
    header: "Total Rounds",
    meta: { sortField: "totalRounds" },
    cell: ({ row }) => <>{row.original.attributes.totalRounds}</>,
  },
  {
    id: "minimumPlayTime",
    header: "Min Time",
    meta: { sortField: "minimumPlayTime" },
    cell: ({ row }) => <>{row.original.attributes.minimumPlayTime}</>,
  },
  {
    id: "attendeeRegistration",
    header: "Attendee Registration",
    meta: { sortField: "attendeeRegistration" },
    cell: ({ row }) => <>{row.original.attributes.attendeeRegistration}</>,
  },
  {
    id: "cost",
    header: "Cost",
    meta: { sortField: "cost" },
    cell: ({ row }) => <>${row.original.attributes.cost.toFixed(2)}</>,
  },
  {
    id: "location",
    header: "Location",
    meta: { sortField: "location" },
    cell: ({ row }) => <>{row.original.attributes.location}</>,
  },
  {
    id: "roomName",
    header: "Room",
    meta: { sortField: "roomName" },
    cell: ({ row }) => <>{row.original.attributes.roomName}</>,
  },
  {
    id: "tableNumber",
    header: "Table Number",
    meta: { sortField: "tableNumber" },
    cell: ({ row }) => <>{row.original.attributes.tableNumber}</>,
  },
  {
    id: "specialCategory",
    header: "Special Category",
    meta: { sortField: "specialCategory" },
    cell: ({ row }) => <>{row.original.attributes.specialCategory}</>,
  },
  {
    id: "ticketsAvailable",
    header: "Tickets Available",
    meta: { sortField: "ticketsAvailable" },
    cell: ({ row }) => <>{row.original.attributes.ticketsAvailable}</>,
  },
  {
    id: "lastModified",
    header: "Last Modified",
    meta: { sortField: "lastModified" },
    cell: ({ row }) => (
      <>
        {format(new Date(row.original.attributes.lastModified), "yyyy-MM-dd")}
      </>
    ),
  },
];

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps) {
  const { visibility, toggle, reset } = useColumnVisibility();
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  let activeSortField: string | undefined;
  let activeSortDir: "asc" | "desc" | undefined;
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split(".");
    if (field && (dir === "asc" || dir === "desc")) {
      activeSortField = field;
      activeSortDir = dir;
    }
  }

  const handleSortClick = (sortField: string, label: string) => {
    if (activeSortField !== sortField) {
      onSort(`${sortField}.asc`);
      announce(`Sorted by ${label}, ascending`);
    } else if (activeSortDir === "asc") {
      onSort(`${sortField}.desc`);
      announce(`Sorted by ${label}, descending`);
    } else {
      onSort(undefined);
      announce("Sort cleared");
    }
  };

  const table = useReactTable({
    data: data?.data ?? [],
    columns: COLUMNS,
    state: {
      columnVisibility: visibility,
    },
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const pagination =
    data && data.data.length > 0 ? (
      <Pagination
        page={page}
        limit={limit}
        total={data.meta.total}
        onNavigate={onNavigate}
      />
    ) : null;

  return (
    <section>
      <details className={styles.visibilityPanel}>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.filter((col) => col.id !== "dayStripe").map((col) => (
              <li key={col.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.id!]}
                    onChange={() => toggle(col.id!)}
                  />
                  {col.header as string}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>
            Reset to defaults
          </button>
        </fieldset>
      </details>

      {isLoading && <PixelState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <PixelState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <PixelState
          variant="empty"
          text="NO QUESTS FOUND"
          subtext="Try broadening your search."
        />
      )}
      {data && data.data.length > 0 && (
        <>
          {pagination}
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      if (header.column.id === "dayStripe") {
                        return (
                          <th
                            key={header.id}
                            className={styles.dayStripe}
                            aria-hidden="true"
                          />
                        );
                      }
                      const sortField = header.column.columnDef.meta?.sortField;
                      const label = header.column.columnDef.header as string;
                      const isActive =
                        !!sortField && activeSortField === sortField;
                      let ariaSort: "ascending" | "descending" | "none" =
                        "none";
                      if (isActive) {
                        ariaSort =
                          activeSortDir === "asc" ? "ascending" : "descending";
                      }
                      return (
                        <th
                          key={header.id}
                          aria-sort={ariaSort}
                          scope="col"
                          aria-label={label}
                        >
                          <button
                            type="button"
                            aria-label={`Sort by ${label}`}
                            onClick={() =>
                              sortField && handleSortClick(sortField, label)
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className={styles.sortIndicator}
                              >
                                {activeSortDir === "asc" ? " ▲" : " ▼"}
                              </span>
                            )}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const dayName = format(
                    new Date(row.original.attributes.startDateTime),
                    "EEEE",
                  );
                  const dayColors = DAY_COLORS[dayName];
                  return (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => {
                        if (cell.column.id === "dayStripe") {
                          return (
                            <td
                              key={cell.id}
                              className={styles.dayStripe}
                              style={
                                dayColors
                                  ? { background: dayColors.color }
                                  : undefined
                              }
                              aria-hidden="true"
                              data-testid="day-stripe"
                            />
                          );
                        }
                        return (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination}
        </>
      )}
    </section>
  );
}
