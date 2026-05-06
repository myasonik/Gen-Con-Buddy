import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";
import type { DayFormat, SharedColumnState } from "./types";
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { Targeted } from "../../ui/icons/Targeted";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { SegmentedControl } from "../../ui/SegmentedControl/SegmentedControl";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
  variant?: "inline" | "drawer";
}

function ColumnCheckboxContent({
  columnState,
}: {
  columnState: SharedColumnState;
}): React.JSX.Element {
  const {
    visibility,
    toggleVisibility,
    resetVisibility,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
  } = columnState;

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
      <fieldset className={styles.columnGroup}>
        <legend className={styles.columnGroupLegend}>Event type column</legend>
        <Checkbox
          checked={showTypeIcon}
          onCheckedChange={(checked) => setShowTypeIcon(checked)}
          label="Show icon"
        />
        <div className={styles.typeDisplayRadioGroup}>
          <SegmentedControl
            value={typeDisplay}
            onValueChange={(v) => setTypeDisplay(v as "code" | "name" | "both")}
          >
            <SegmentedControl.Option value="code" indicator={<Targeted size={16} />}>
              Code
            </SegmentedControl.Option>
            <SegmentedControl.Option value="name" indicator={<Targeted size={16} />}>
              Name
            </SegmentedControl.Option>
            <SegmentedControl.Option value="both" indicator={<Targeted size={16} />}>
              Both
            </SegmentedControl.Option>
          </SegmentedControl>
        </div>
      </fieldset>
      <fieldset className={styles.columnGroup}>
        <legend className={styles.columnGroupLegend}>Day column</legend>
        <div className={styles.typeDisplayRadioGroup}>
          <SegmentedControl value={dayFormat} onValueChange={(v) => setDayFormat(v as DayFormat)}>
            <SegmentedControl.Option value="day" indicator={<Targeted size={16} />}>
              Day
            </SegmentedControl.Option>
            <SegmentedControl.Option value="numeric" indicator={<Targeted size={16} />}>
              MM/DD/YY
            </SegmentedControl.Option>
            <SegmentedControl.Option value="long" indicator={<Targeted size={16} />}>
              Full date
            </SegmentedControl.Option>
          </SegmentedControl>
        </div>
      </fieldset>
      <div className={styles.columnActions}>
        <Button
          variant="ghost"
          onClick={() => {
            resetVisibility();
            resetSizing();
            resetTypeDisplay();
            resetDayFormat();
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
}: ColumnControlsPanelProps): React.JSX.Element {
  if (variant === "drawer") {
    return (
      <Drawer
        trigger={
          <Button type="button" variant="secondary">
            Customize columns
          </Button>
        }
        title="Customize columns"
      >
        <ColumnCheckboxContent columnState={columnState} />
      </Drawer>
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
