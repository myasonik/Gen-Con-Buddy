import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
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
}: ColumnActionsPopoverProps): React.JSX.Element {
  const isSortedAsc =
    Boolean(sortField) && activeSortField === sortField && activeSortDir === "asc";
  const isSortedDesc =
    Boolean(sortField) && activeSortField === sortField && activeSortDir === "desc";

  return (
    <Popover.Root>
      <Popover.Trigger
        render={<Button icon className={styles.trigger} />}
        aria-label="Column actions"
      >
        <EllipsisVertical size={12} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            {sortField && (
              <>
                <Popover.Close
                  render={<Button variant="ghost" className={styles.menuItem} />}
                  aria-pressed={isSortedAsc}
                  onClick={() => onSort(isSortedAsc ? undefined : `${sortField}.asc`)}
                >
                  Sort ascending
                </Popover.Close>
                <Popover.Close
                  render={<Button variant="ghost" className={styles.menuItem} />}
                  aria-pressed={isSortedDesc}
                  onClick={() => onSort(isSortedDesc ? undefined : `${sortField}.desc`)}
                >
                  Sort descending
                </Popover.Close>
              </>
            )}
            <Popover.Close
              render={<Button variant="ghost" className={styles.menuItem} />}
              onClick={onOpenResize}
            >
              Resize…
            </Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
