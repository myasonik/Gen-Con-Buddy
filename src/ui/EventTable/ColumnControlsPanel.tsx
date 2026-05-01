import { Button } from "../Button/Button";
import type { SharedColumnState } from "./EventTable";
import { COLUMNS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
}

export function ColumnControlsPanel({ columnState }: ColumnControlsPanelProps): JSX.Element {
  const { visibility, toggleVisibility, resetVisibility, resetSizing } = columnState;
  return (
    <details className={`${styles.visibilityPanel} animates-details`}>
      <summary>Customize columns</summary>
      <div><fieldset>
        <ul>
          {COLUMNS.map((col) => (
            <li key={col.id}>
              <label>
                <input
                  type="checkbox"
                  checked={col.id !== undefined && Boolean(visibility[col.id])}
                  onChange={() => {
                    if (col.id !== undefined) {
                      toggleVisibility(col.id);
                    }
                  }}
                />
                {typeof col.header === "string" ? col.header : col.id}
              </label>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          onClick={() => {
            resetVisibility();
            resetSizing();
          }}
        >
          Reset to defaults
        </Button>
      </fieldset></div>
    </details>
  );
}
