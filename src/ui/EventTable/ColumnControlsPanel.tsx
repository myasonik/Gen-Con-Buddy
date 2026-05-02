import { ChevronRight } from "lucide-react";
import { Button } from "../Button/Button";
import type { SharedColumnState } from "./types";
import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
import { D6Face } from "../icons/D6Face";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
}

export function ColumnControlsPanel({ columnState }: ColumnControlsPanelProps): JSX.Element {
  const { visibility, toggleVisibility, resetVisibility, resetSizing } = columnState;

  const colById = new Map(COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id, c]));

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
    </AnimatedDetails>
  );
}
