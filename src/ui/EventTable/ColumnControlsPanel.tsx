import { ChevronRight, X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "../Button/Button";
import type { SharedColumnState } from "./types";
import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
import { D6Face } from "../icons/D6Face";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
  variant?: "inline" | "drawer";
}

function ColumnCheckboxContent({ columnState }: { columnState: SharedColumnState }): JSX.Element {
  const { visibility, toggleVisibility, resetVisibility, resetSizing } = columnState;
  const colById = new Map(COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id, c]));

  return (
    <fieldset className={styles.columnFieldset}>
      {COLUMN_GROUPS.map((group) => (
        <fieldset key={group.label} className={styles.columnGroup}>
          <legend className={styles.columnGroupLegend}>{group.label}</legend>
          <ul className={styles.columnList}>
            {group.columnIds.map((id) => {
              const col = colById.get(id);
              if (!col) {
                return null;
              }
              const isChecked = Boolean(visibility[id]);
              return (
                <li key={id}>
                  <label className={styles.columnToggle}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => toggleVisibility(id)}
                    />
                    <span className={styles.columnCheckbox} aria-hidden="true">
                      <D6Face size={16} />
                    </span>
                    <span className={styles.columnLabel}>
                      {typeof col.header === "string" ? col.header : id}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
      <div className={styles.columnActions}>
        <Button
          variant="ghost"
          onClick={() => {
            resetVisibility();
            resetSizing();
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </fieldset>
  );
}

export function ColumnControlsPanel({
  columnState,
  variant = "inline",
}: ColumnControlsPanelProps): JSX.Element {
  if (variant === "drawer") {
    return (
      <Dialog.Root>
        <Dialog.Trigger
          render={
            <Button type="button" variant="secondary">
              Customize columns
            </Button>
          }
        />
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.columnsBackdrop} />
          <Dialog.Popup className={styles.columnsDrawer}>
            <div className={styles.columnsDrawerHeader}>
              <Dialog.Title className={styles.columnsDrawerTitle}>Customize columns</Dialog.Title>
              <Dialog.Close
                render={
                  <Button type="button" variant="ghost" icon aria-label="Close">
                    <X size={16} />
                  </Button>
                }
              />
            </div>
            <div className={styles.columnsDrawerScroll}>
              <ColumnCheckboxContent columnState={columnState} />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <AnimatedDetails
      className={styles.visibilityPanel}
      summary={
        <>
          Customize columns
          <span className={styles.summaryChevron} aria-hidden="true">
            <ChevronRight size={14} />
          </span>
        </>
      }
    >
      <ColumnCheckboxContent columnState={columnState} />
    </AnimatedDetails>
  );
}
