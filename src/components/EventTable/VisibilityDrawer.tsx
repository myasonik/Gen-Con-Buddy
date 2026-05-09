import React from "react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";
import type { SharedColumnState } from "./types";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import styles from "./VisibilityDrawer.module.css";

interface VisibilityDrawerProps {
  columnState: SharedColumnState;
}

export function VisibilityDrawer({ columnState }: VisibilityDrawerProps): React.JSX.Element {
  const { visibility, toggleVisibility, resetVisibility, resetSizing } = columnState;
  const colById = new Map(COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id, c]));

  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          Visibility
        </Button>
      }
      title="Visibility"
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
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleVisibility(id)}
                      label={typeof col.header === "string" ? col.header : id}
                    />
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
            Reset
          </Button>
        </div>
      </fieldset>
    </Drawer>
  );
}
