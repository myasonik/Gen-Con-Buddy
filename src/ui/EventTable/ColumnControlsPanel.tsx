import { Button } from "../Button/Button";
import { TypeDisplaySlider } from "../TypeDisplaySlider/TypeDisplaySlider";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import type { SharedColumnState } from "./types";
import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
import { COLUMNS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
}

export function ColumnControlsPanel({ columnState }: ColumnControlsPanelProps): JSX.Element {
  const {
    visibility,
    toggleVisibility,
    resetVisibility,
    resetSizing,
    typeDisplay: externalTypeDisplay,
    setTypeDisplay: externalSetTypeDisplay,
  } = columnState;
  const internal = useTypeDisplay();
  const typeDisplay = externalTypeDisplay ?? internal.typeDisplay;
  const setTypeDisplay = externalSetTypeDisplay ?? internal.setTypeDisplay;
  const resetTypeDisplay = externalSetTypeDisplay
    ? (): void => externalSetTypeDisplay("both")
    : internal.reset;

  return (
    <AnimatedDetails className={styles.visibilityPanel} summary="Customize columns">
      <fieldset>
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
        <hr className={styles.panelDivider} />
        <TypeDisplaySlider value={typeDisplay} onChange={setTypeDisplay} />
        <Button
          variant="secondary"
          onClick={() => {
            resetVisibility();
            resetSizing();
            resetTypeDisplay();
          }}
        >
          Reset to defaults
        </Button>
      </fieldset>
    </AnimatedDetails>
  );
}
