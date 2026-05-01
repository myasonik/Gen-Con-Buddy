import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../Button/Button";
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
}: ColumnActionsPopoverProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const isSortedAsc =
    Boolean(sortField) && activeSortField === sortField && activeSortDir === "asc";
  const isSortedDesc =
    Boolean(sortField) && activeSortField === sortField && activeSortDir === "desc";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-label="Column actions"
      >
        <EllipsisVertical size={12} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            {sortField && (
              <>
                <Button
                  variant="ghost"
                  aria-pressed={isSortedAsc}
                  onClick={() => {
                    onSort(isSortedAsc ? undefined : `${sortField}.asc`);
                    setOpen(false);
                  }}
                >
                  Sort ascending
                </Button>
                <Button
                  variant="ghost"
                  aria-pressed={isSortedDesc}
                  onClick={() => {
                    onSort(isSortedDesc ? undefined : `${sortField}.desc`);
                    setOpen(false);
                  }}
                >
                  Sort descending
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                onOpenResize();
              }}
            >
              Resize…
            </Button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
