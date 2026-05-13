import React, { useState, useId, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { useSortState } from "../../hooks/useSortState";
import { useColumnMinSizes } from "../../hooks/useColumnMinSizes";
import { parseSortString } from "../../utils/parseSortString";
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import {
  TypeFormatControls,
  DayFormatControls,
  TimeFormatControls,
  TimeHourControls,
} from "./FormatDrawer";
import { ColumnResizeDialog } from "./ColumnResizeDialog";
import { announce } from "../../lib/announce";
import type { Event } from "../../utils/types";
import { COLUMNS, SORT_FIELD_BY_COL_ID, COL_ID_BY_SORT_FIELD } from "./columns";
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
import type { SharedColumnState } from "./types";
import styles from "./EventTable.module.css";

export type { SharedColumnState };

interface EventTableProps {
  events: Event[];
  activeSortField?: string;
  activeSortDir?: "asc" | "desc";
  onSort?: (sort: string | undefined) => void;
  sharedColumnState: SharedColumnState;
  linkState?: { from: string };
}

export function EventTable({
  events,
  activeSortField,
  activeSortDir,
  onSort,
  sharedColumnState,
  linkState,
}: EventTableProps): React.JSX.Element {
  const posthog = usePostHog();
  const {
    visibility,
    sizing,
    setSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    dayFormat,
    setDayFormat,
    timeZone,
    setTimeZone,
    timeFormat,
    setTimeFormat,
  } = sharedColumnState;

  // Unique prefix so anchor names don't collide when multiple EventTable instances are on the page
  const tableId = useId().replace(/:/g, "");
  const tableRef = useRef<HTMLTableElement>(null);
  const columnMinSizes = useColumnMinSizes(tableRef, events, {
    visibility,
    typeDisplay,
    showTypeIcon,
    dayFormat,
  });
  const [clipWrapper, setClipWrapper] = useState<HTMLDivElement | null>(null);
  const [resizeTarget, setResizeTarget] = useState<{
    columnId: string;
    columnName: string;
    currentWidth: number;
  } | null>(null);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

  const externalSort = useSortState({
    activeSortField,
    activeSortDir,
    onSort: (field, dir) => {
      if (onSort) {
        onSort(`${field}.${dir}`);
      }
    },
  });

  let effectiveSortField: string | undefined = undefined;
  if (onSort) {
    effectiveSortField = activeSortField;
  } else if (internalSorting.length > 0) {
    effectiveSortField = SORT_FIELD_BY_COL_ID.get(internalSorting[0].id) ?? internalSorting[0].id;
  }

  let effectiveSortDir: "asc" | "desc" | undefined = undefined;
  if (onSort) {
    effectiveSortDir = activeSortDir;
  } else if (internalSorting.length > 0) {
    effectiveSortDir = internalSorting[0].desc ? "desc" : "asc";
  }

  const handleHeaderSortClick = (sortField: string, label: string): void => {
    if (onSort) {
      if (effectiveSortField !== sortField) {
        externalSort.handleColumnClick(COL_ID_BY_SORT_FIELD.get(sortField) ?? sortField);
        announce(`Sorted by ${label}, ascending`);
        posthog.capture("results_sorted", { sort_field: sortField, sort_direction: "asc", label });
      } else if (effectiveSortDir === "asc") {
        externalSort.handleColumnClick(COL_ID_BY_SORT_FIELD.get(sortField) ?? sortField);
        announce(`Sorted by ${label}, descending`);
        posthog.capture("results_sorted", { sort_field: sortField, sort_direction: "desc", label });
      } else {
        onSort(undefined);
        announce("Sort cleared");
        posthog.capture("results_sorted", { sort_field: null, sort_direction: null, label });
      }
    } else {
      const colId = COL_ID_BY_SORT_FIELD.get(sortField) ?? sortField;
      if (effectiveSortField !== sortField) {
        setInternalSorting([{ id: colId, desc: false }]);
        announce(`Sorted by ${label}, ascending`);
        posthog.capture("results_sorted", { sort_field: sortField, sort_direction: "asc", label });
      } else if (effectiveSortDir === "asc") {
        setInternalSorting([{ id: colId, desc: true }]);
        announce(`Sorted by ${label}, descending`);
        posthog.capture("results_sorted", { sort_field: sortField, sort_direction: "desc", label });
      } else {
        setInternalSorting([]);
        announce("Sort cleared");
        posthog.capture("results_sorted", { sort_field: null, sort_direction: null, label });
      }
    }
  };

  const handlePopoverSort = (s: string | undefined, label: string): void => {
    if (onSort) {
      onSort(s);
      if (s) {
        const dir = s.endsWith(".asc") ? "ascending" : "descending";
        announce(`Sorted by ${label}, ${dir}`);
        posthog.capture("results_sorted", {
          sort_field: s.split(".")[0],
          sort_direction: s.endsWith(".asc") ? "asc" : "desc",
          label,
        });
      } else {
        announce("Sort cleared");
        posthog.capture("results_sorted", { sort_field: null, sort_direction: null, label });
      }
    } else {
      if (s === undefined) {
        setInternalSorting([]);
        announce("Sort cleared");
        posthog.capture("results_sorted", { sort_field: null, sort_direction: null, label });
      } else {
        const parsed = parseSortString(s);
        if (parsed) {
          const colId = COL_ID_BY_SORT_FIELD.get(parsed.field) ?? parsed.field;
          setInternalSorting([{ id: colId, desc: parsed.dir === "desc" }]);
          announce(`Sorted by ${label}, ${parsed.dir === "asc" ? "ascending" : "descending"}`);
          posthog.capture("results_sorted", {
            sort_field: parsed.field,
            sort_direction: parsed.dir,
            label,
          });
        }
      }
    }
  };

  const table = useReactTable({
    data: events,
    columns: COLUMNS,
    columnResizeMode: "onChange",
    state: {
      columnVisibility: visibility,
      columnSizing: sizing,
      sorting: internalSorting,
    },
    onColumnSizingChange: (updater) => {
      setSizing((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return Object.fromEntries(
          Object.entries(next).map(([id, size]) => [id, Math.max(size, columnMinSizes[id] ?? 0)]),
        );
      });
    },
    onSortingChange: setInternalSorting,
    manualSorting: Boolean(onSort),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getFormatControls = (columnId: string): React.ReactNode => {
    if (columnId === "eventType") {
      return (
        <TypeFormatControls
          typeDisplay={typeDisplay}
          setTypeDisplay={setTypeDisplay}
          showTypeIcon={showTypeIcon}
          setShowTypeIcon={setShowTypeIcon}
        />
      );
    }
    if (columnId === "day") {
      return <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />;
    }
    if (columnId === "startDateTime" || columnId === "endDateTime") {
      return (
        <>
          <TimeFormatControls timeZone={timeZone} setTimeZone={setTimeZone} />
          <TimeHourControls timeFormat={timeFormat} setTimeFormat={setTimeFormat} />
        </>
      );
    }
    return undefined;
  };

  if (events.length === 0) {
    return <p>No events.</p>;
  }

  return (
    <section>
      <div
        ref={setClipWrapper}
        className={styles.tableClipWrapper}
        data-testid="table-clip-wrapper"
      >
        <div className={styles.tableWrapper}>
          <table ref={tableRef}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortField = header.column.columnDef.meta?.sortField;
                    const colHeader = header.column.columnDef.header;
                    const label =
                      typeof colHeader === "string" ? colHeader : (header.column.id ?? "");
                    const isActive = Boolean(sortField) && effectiveSortField === sortField;
                    let ariaSort: "ascending" | "descending" | "none" = "none";
                    if (isActive) {
                      ariaSort = effectiveSortDir === "asc" ? "ascending" : "descending";
                    }
                    return (
                      <th
                        key={header.id}
                        aria-sort={sortField ? ariaSort : undefined}
                        scope="col"
                        className={styles.resizableTh}
                        style={
                          {
                            width: header.getSize(),
                            anchorName: `--col-${tableId}-${header.id}`,
                          } as React.CSSProperties & { anchorName: string }
                        }
                      >
                        <div className={styles.thContent}>
                          <button
                            type="button"
                            className={styles.sortButton}
                            onClick={() => sortField && handleHeaderSortClick(sortField, label)}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {isActive && (
                              <span aria-hidden="true" className={styles.sortIndicator}>
                                {effectiveSortDir === "asc" ? (
                                  <ArrowUp size={12} aria-hidden="true" />
                                ) : (
                                  <ArrowDown size={12} aria-hidden="true" />
                                )}
                              </span>
                            )}
                          </button>
                          {header.column.getCanResize() && (
                            <ColumnActionsPopover
                              sortField={sortField}
                              activeSortField={effectiveSortField}
                              activeSortDir={effectiveSortDir}
                              onSort={(s) => handlePopoverSort(s, label)}
                              onOpenResize={() =>
                                setResizeTarget({
                                  columnId: header.column.id,
                                  columnName: label,
                                  currentWidth: header.getSize(),
                                })
                              }
                              formatControls={getFormatControls(header.column.id)}
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} data-staff-pick={STAFF_PICK_IDS.has(row.original.attributes.gameId) || undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} data-col-id={cell.column.id}>
                      {flexRender(cell.column.columnDef.cell, {
                        ...cell.getContext(),
                        dayFormat,
                        typeDisplay,
                        showTypeIcon,
                        linkState,
                        timeZone,
                        timeFormat,
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {clipWrapper &&
        createPortal(
          table
            .getHeaderGroups()
            .flatMap((hg) => hg.headers)
            .filter((h) => h.column.getCanResize())
            .map((header) => (
              <div
                key={header.id}
                className={styles.resizeHandle}
                style={
                  {
                    positionAnchor: `--col-${tableId}-${header.id}`,
                  } as React.CSSProperties & { positionAnchor: string }
                }
                onPointerDown={header.getResizeHandler()}
                aria-hidden="true"
                data-testid={`resize-handle-${header.id}`}
                data-resizing={header.column.getIsResizing() || undefined}
              />
            )),
          clipWrapper,
        )}

      {resizeTarget && (
        <ColumnResizeDialog
          columnName={resizeTarget.columnName}
          currentWidth={resizeTarget.currentWidth}
          minWidth={columnMinSizes[resizeTarget.columnId] ?? 0}
          onApply={(width) => {
            table.setColumnSizing((prev) => ({ ...prev, [resizeTarget.columnId]: width }));
          }}
          onClose={() => setResizeTarget(null)}
        />
      )}
    </section>
  );
}
