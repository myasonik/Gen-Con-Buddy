import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { addSort, removeSort, setSortDir } from "../../utils/sortManipulation";
import type { SortState } from "../../utils/types";
import styles from "./ColumnActionsPopover.module.css";

interface ColumnActionsPopoverProps {
  sortField: string | undefined;
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  onOpenSortDrawer: () => void;
  onOpenResize: () => void;
  formatControls?: React.ReactNode;
}

export function ColumnActionsPopover({
  sortField,
  activeSort,
  onSort,
  onOpenSortDrawer,
  onOpenResize,
  formatControls,
}: ColumnActionsPopoverProps): React.JSX.Element {
  const sortEntry = sortField ? activeSort.find((s) => s.field === sortField) : undefined;
  const isInSort = sortEntry !== undefined;
  const showDrawerButton = Boolean(sortField) && !isInSort && activeSort.length >= 2;

  function handleSortDir(dir: "asc" | "desc", field: string): void {
    const isSortedThisDir = sortEntry?.dir === dir;
    if (isInSort) {
      onSort(isSortedThisDir ? removeSort(activeSort, field) : setSortDir(activeSort, field, dir));
    } else {
      onSort(addSort(activeSort, field, dir));
    }
  }

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
                {showDrawerButton ? (
                  <Popover.Close
                    render={<Button variant="ghost" className={styles.menuItem} />}
                    onClick={() => onOpenSortDrawer()}
                  >
                    Sort by this field…
                  </Popover.Close>
                ) : (
                  <>
                    <Popover.Close
                      render={<Button variant="ghost" className={styles.menuItem} />}
                      aria-pressed={sortEntry?.dir === "asc"}
                      onClick={() => handleSortDir("asc", sortField)}
                    >
                      Sort ascending
                    </Popover.Close>
                    <Popover.Close
                      render={<Button variant="ghost" className={styles.menuItem} />}
                      aria-pressed={sortEntry?.dir === "desc"}
                      onClick={() => handleSortDir("desc", sortField)}
                    >
                      Sort descending
                    </Popover.Close>
                    {isInSort && (
                      <Popover.Close
                        render={<Button variant="ghost" className={styles.menuItem} />}
                        onClick={() => onSort(removeSort(activeSort, sortField))}
                      >
                        Remove sort
                      </Popover.Close>
                    )}
                  </>
                )}
              </>
            )}
            <Popover.Close
              render={<Button variant="ghost" className={styles.menuItem} />}
              onClick={onOpenResize}
            >
              Resize…
            </Popover.Close>
            {formatControls !== undefined && (
              <>
                <hr className={styles.divider} aria-hidden="true" />
                <div className={styles.formatSection}>{formatControls}</div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
