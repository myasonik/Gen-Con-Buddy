import { useState, useId } from "react";
import { createPortal } from "react-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import { ColumnResizeDialog } from "./ColumnResizeDialog";
import { announce } from "../../lib/announce";
import type { Event } from "../../utils/types";
import { COLUMNS, SORT_FIELD_BY_COL_ID, COL_ID_BY_SORT_FIELD } from "./columns";
import styles from "./EventTable.module.css";

interface EventTableProps {
  events: Event[];
  activeSortField?: string;
  activeSortDir?: "asc" | "desc";
  onSort?: (sort: string | undefined) => void;
}

export function EventTable({
  events,
  activeSortField,
  activeSortDir,
  onSort,
}: EventTableProps) {
  const { visibility, toggle, reset } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  // Unique prefix so anchor names don't collide when multiple EventTable instances are on the page
  const tableId = useId().replace(/:/g, "");
  const [resizeTarget, setResizeTarget] = useState<{
    columnId: string;
    columnName: string;
    currentWidth: number;
  } | null>(null);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

  let effectiveSortField: string | undefined;
  if (onSort) {
    effectiveSortField = activeSortField;
  } else if (internalSorting.length > 0) {
    effectiveSortField =
      SORT_FIELD_BY_COL_ID.get(internalSorting[0].id) ?? internalSorting[0].id;
  }

  let effectiveSortDir: "asc" | "desc" | undefined;
  if (onSort) {
    effectiveSortDir = activeSortDir;
  } else if (internalSorting.length > 0) {
    effectiveSortDir = internalSorting[0].desc ? "desc" : "asc";
  }

  const handleHeaderSortClick = (sortField: string, label: string) => {
    if (onSort) {
      if (effectiveSortField !== sortField) {
        onSort(`${sortField}.asc`);
        announce(`Sorted by ${label}, ascending`);
      } else if (effectiveSortDir === "asc") {
        onSort(`${sortField}.desc`);
        announce(`Sorted by ${label}, descending`);
      } else {
        onSort(undefined);
        announce("Sort cleared");
      }
    } else {
      const colId = COL_ID_BY_SORT_FIELD.get(sortField) ?? sortField;
      if (effectiveSortField !== sortField) {
        setInternalSorting([{ id: colId, desc: false }]);
        announce(`Sorted by ${label}, ascending`);
      } else if (effectiveSortDir === "asc") {
        setInternalSorting([{ id: colId, desc: true }]);
        announce(`Sorted by ${label}, descending`);
      } else {
        setInternalSorting([]);
        announce("Sort cleared");
      }
    }
  };

  const handlePopoverSort = (s: string | undefined, label: string) => {
    if (onSort) {
      onSort(s);
      if (s)
        announce(
          `Sorted by ${label}, ${s.endsWith(".asc") ? "ascending" : "descending"}`,
        );
      else announce("Sort cleared");
    } else {
      if (s === undefined) {
        setInternalSorting([]);
        announce("Sort cleared");
      } else {
        const [field, dir] = s.split(".");
        if (field && (dir === "asc" || dir === "desc")) {
          const colId = COL_ID_BY_SORT_FIELD.get(field) ?? field;
          setInternalSorting([{ id: colId, desc: dir === "desc" }]);
          announce(
            `Sorted by ${label}, ${dir === "asc" ? "ascending" : "descending"}`,
          );
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
    onColumnSizingChange: setSizing,
    onSortingChange: setInternalSorting,
    manualSorting: !!onSort,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (events.length === 0) {
    return <p>No events.</p>;
  }

  return (
    <section>
      <details className={styles.visibilityPanel}>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
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
          <button
            type="button"
            onClick={() => {
              reset();
              resetSizing();
            }}
          >
            Reset to defaults
          </button>
        </fieldset>
      </details>

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortField = header.column.columnDef.meta?.sortField;
                  const label = header.column.columnDef.header as string;
                  const isActive =
                    !!sortField && effectiveSortField === sortField;
                  let ariaSort: "ascending" | "descending" | "none" = "none";
                  if (isActive) {
                    ariaSort =
                      effectiveSortDir === "asc" ? "ascending" : "descending";
                  }
                  return (
                    <th
                      key={header.id}
                      aria-sort={sortField ? ariaSort : undefined}
                      scope="col"
                      aria-label={label}
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
                          aria-label={`Sort by ${label}`}
                          onClick={() =>
                            sortField && handleHeaderSortClick(sortField, label)
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
                              {effectiveSortDir === "asc" ? " ▲" : " ▼"}
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
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createPortal(
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
        document.body,
      )}

      {resizeTarget && (
        <ColumnResizeDialog
          columnName={resizeTarget.columnName}
          currentWidth={resizeTarget.currentWidth}
          onApply={(width) => {
            setSizing((prev) => ({ ...prev, [resizeTarget.columnId]: width }));
          }}
          onClose={() => setResizeTarget(null)}
        />
      )}
    </section>
  );
}
