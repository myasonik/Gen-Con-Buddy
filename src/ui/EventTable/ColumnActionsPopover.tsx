import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import styles from "./ColumnActionsPopover.module.css";

interface ColumnActionsPopoverProps {
  sortField: string | undefined;
  activeSortField: string | undefined;
  activeSortDir: "asc" | "desc" | undefined;
  onSort: (sort: string | undefined) => void;
  onOpenResize: () => void;
}

export function ColumnActionsPopover({
  sortField,
  activeSortField,
  activeSortDir,
  onSort,
  onOpenResize,
}: ColumnActionsPopoverProps) {
  const [open, setOpen] = useState(false);

  const isSortedAsc =
    !!sortField && activeSortField === sortField && activeSortDir === "asc";
  const isSortedDesc =
    !!sortField && activeSortField === sortField && activeSortDir === "desc";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-label="Column actions"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="6" cy="2" r="1.5" fill="currentColor" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          <circle cx="6" cy="10" r="1.5" fill="currentColor" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup className={styles.popup}>
            {sortField && (
              <>
                <button
                  type="button"
                  className={styles.action}
                  aria-pressed={isSortedAsc}
                  onClick={() => {
                    onSort(isSortedAsc ? undefined : `${sortField}.asc`);
                    setOpen(false);
                  }}
                >
                  Sort ascending
                </button>
                <button
                  type="button"
                  className={styles.action}
                  aria-pressed={isSortedDesc}
                  onClick={() => {
                    onSort(isSortedDesc ? undefined : `${sortField}.desc`);
                    setOpen(false);
                  }}
                >
                  Sort descending
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                setOpen(false);
                onOpenResize();
              }}
            >
              Resize…
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
