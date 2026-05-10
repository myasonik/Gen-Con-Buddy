import React from "react";
import { VisibilityDrawer } from "./VisibilityDrawer";
import { FormatDrawer } from "./FormatDrawer";
import { SortDrawer } from "./SortDrawer";
import type { SharedColumnState } from "./types";
import type { SortState } from "../../utils/types";
import styles from "./ColumnControlsPanel.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  sortDrawerOpen: boolean;
  onSortDrawerOpenChange: (open: boolean) => void;
}

export function ColumnControlsPanel({
  columnState,
  activeSort,
  onSort,
  sortDrawerOpen,
  onSortDrawerOpenChange,
}: ColumnControlsPanelProps): React.JSX.Element {
  return (
    <div className={styles.controls}>
      <VisibilityDrawer columnState={columnState} />
      <FormatDrawer columnState={columnState} />
      <SortDrawer
        activeSort={activeSort}
        onSort={onSort}
        columnVisibility={columnState.visibility}
        open={sortDrawerOpen}
        onOpenChange={onSortDrawerOpenChange}
      />
    </div>
  );
}
