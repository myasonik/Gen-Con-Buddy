import React, { useState, useId, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useColumnMinSizes } from "../../hooks/useColumnMinSizes";
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import {
  TypeFormatControls,
  DayFormatControls,
  TimeFormatControls,
  TimeHourControls,
} from "./FormatDrawer";
import { ColumnResizeDialog } from "./ColumnResizeDialog";
import { announce } from "../../lib/announce";
import type { Event, SortState } from "../../utils/types";
import { addSort, removeSort, setSortDir } from "../../utils/sortManipulation";
import { COLUMNS, SORT_FIELD_BY_COL_ID, COL_ID_BY_SORT_FIELD } from "./columns";
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
import type { SharedColumnState } from "./types";
import styles from "./EventTable.module.css";

export type { SharedColumnState };

function applyHeaderSort(
  sorts: SortState[],
  sortField: string,
  label: string,
): { newSort: SortState[]; message: string } {
  const existing = sorts.find((s) => s.field === sortField);
  if (!existing) {
    return { newSort: addSort(sorts, sortField), message: `Added ${label} to sort, ascending` };
  }
  if (existing.dir === "asc") {
    return {
      newSort: setSortDir(sorts, sortField, "desc"),
      message: `${label} sorted descending`,
    };
  }
  return { newSort: removeSort(sorts, sortField), message: `${label} removed from sort` };
}

interface EventTableProps {
  events: Event[];
  activeSort?: SortState[];
  onSort?: (sorts: SortState[]) => void;
  onOpenSortDrawer?: () => void;
  sharedColumnState: SharedColumnState;
  linkState?: { from: string };
}

export function EventTable({
  events,
  activeSort,
  onSort,
  onOpenSortDrawer,
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

  const [internalSort, setInternalSort] = useState<SortState[]>([]);

  const effectiveSort: SortState[] = onSort ? (activeSort ?? []) : internalSort;

  const tanstackSorting = internalSort.map((s) => ({
    id: COL_ID_BY_SORT_FIELD.get(s.field) ?? s.field,
    desc: s.dir === "desc",
  }));

  const handleHeaderSortClick = (sortField: string, label: string): void => {
    if (effectiveSort.length >= 2) {
      onOpenSortDrawer?.();
      return;
    }

    const { newSort, message } = applyHeaderSort(effectiveSort, sortField, label);
    announce(message);

    if (onSort) {
      onSort(newSort);
    } else {
      setInternalSort(newSort);
    }
    posthog.capture("results_sorted", {
      sort_fields: newSort.map((s) => s.field),
      sort_count: newSort.length,
    });
  };

  const handlePopoverSort = (newSort: SortState[]): void => {
    if (onSort) {
      onSort(newSort);
    } else {
      setInternalSort(newSort);
    }
    announce(newSort.length === 0 ? "Sort cleared" : "Sort updated");
    posthog.capture("results_sorted", {
      sort_fields: newSort.map((s) => s.field),
      sort_count: newSort.length,
    });
  };

  const table = useReactTable({
    data: events,
    columns: COLUMNS,
    columnResizeMode: "onChange",
    state: {
      columnVisibility: visibility,
      columnSizing: sizing,
      sorting: onSort ? [] : tanstackSorting,
    },
    onColumnSizingChange: (updater) => {
      setSizing((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return Object.fromEntries(
          Object.entries(next).map(([id, size]) => [id, Math.max(size, columnMinSizes[id] ?? 0)]),
        );
      });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(tanstackSorting) : updater;
      setInternalSort(
        next.map((s) => ({
          field: SORT_FIELD_BY_COL_ID.get(s.id) ?? s.id,
          dir: s.desc ? ("desc" as const) : ("asc" as const),
        })),
      );
    },
    manualSorting: Boolean(onSort),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
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
          <table ref={tableRef} className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortField = header.column.columnDef.meta?.sortField;
                    const colHeader = header.column.columnDef.header;
                    const label =
                      typeof colHeader === "string" ? colHeader : (header.column.id ?? "");
                    const isActive =
                      Boolean(sortField) && effectiveSort.some((s) => s.field === sortField);
                    const activeEntry = effectiveSort.find((s) => s.field === sortField);
                    let ariaSort: "ascending" | "descending" | "none" = "none";
                    if (isActive && activeEntry) {
                      ariaSort = activeEntry.dir === "asc" ? "ascending" : "descending";
                    }
                    return (
                      <th
                        key={header.id}
                        aria-sort={sortField && onSort ? ariaSort : undefined}
                        scope="col"
                        className={styles.th}
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
                                {activeEntry?.dir === "asc" ? (
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
                              activeSort={effectiveSort}
                              onSort={(newSort) => handlePopoverSort(newSort)}
                              onOpenSortDrawer={() => onOpenSortDrawer?.()}
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
                <tr
                  key={row.id}
                  className={styles.row}
                  data-staff-pick={STAFF_PICK_IDS.has(row.original.attributes.gameId) || undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.cell} data-col-id={cell.column.id}>
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
