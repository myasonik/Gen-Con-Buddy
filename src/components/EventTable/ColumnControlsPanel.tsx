import React from "react";
import { VisibilityDrawer } from "./VisibilityDrawer";
import { FormatDrawer } from "./FormatDrawer";
import { SortDrawer } from "./SortDrawer";
import type { SharedColumnState } from "./types";
import styles from "./ColumnControlsPanel.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
  allowSort?: boolean;
}

export function ColumnControlsPanel({
  columnState,
  allowSort,
}: ColumnControlsPanelProps): React.JSX.Element {
  return (
    <div className={styles.controls}>
      <VisibilityDrawer columnState={columnState} />
      <FormatDrawer columnState={columnState} />
      {allowSort && <SortDrawer />}
    </div>
  );
}
