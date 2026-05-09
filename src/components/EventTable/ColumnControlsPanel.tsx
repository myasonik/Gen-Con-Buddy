import React from "react";
import { VisibilityDrawer } from "./VisibilityDrawer";
import { FormatDrawer } from "./FormatDrawer";
import type { SharedColumnState } from "./types";
import styles from "./ColumnControlsPanel.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
}

export function ColumnControlsPanel({ columnState }: ColumnControlsPanelProps): React.JSX.Element {
  return (
    <div className={styles.controls}>
      <VisibilityDrawer columnState={columnState} />
      <FormatDrawer columnState={columnState} />
    </div>
  );
}
