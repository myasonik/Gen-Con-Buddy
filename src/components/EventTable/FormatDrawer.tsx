import React from "react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { SegmentedControl } from "../../ui/SegmentedControl/SegmentedControl";
import { Targeted } from "../../ui/icons/Targeted";
import type { SharedColumnState, TypeDisplay, DayFormat, TimeZone, TimeFormat } from "./types";
import styles from "./FormatDrawer.module.css";

interface TypeFormatControlsProps {
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
}

export function TypeFormatControls({
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
}: TypeFormatControlsProps): React.JSX.Element {
  return (
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
          onValueChange={(v) => setTypeDisplay(v as TypeDisplay)}
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
  );
}

interface DayFormatControlsProps {
  dayFormat: DayFormat;
  setDayFormat: (v: DayFormat) => void;
}

export function DayFormatControls({
  dayFormat,
  setDayFormat,
}: DayFormatControlsProps): React.JSX.Element {
  return (
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
  );
}

interface TimeFormatControlsProps {
  timeZone: TimeZone;
  setTimeZone: (v: TimeZone) => void;
}

export function TimeFormatControls({
  timeZone,
  setTimeZone,
}: TimeFormatControlsProps): React.JSX.Element {
  return (
    <fieldset className={styles.columnGroup}>
      <legend className={styles.columnGroupLegend}>Time columns</legend>
      <div className={styles.typeDisplayRadioGroup}>
        <SegmentedControl value={timeZone} onValueChange={(v) => setTimeZone(v as TimeZone)}>
          <SegmentedControl.Option value="indy" indicator={<Targeted size={16} />}>
            Indianapolis
          </SegmentedControl.Option>
          <SegmentedControl.Option value="local" indicator={<Targeted size={16} />}>
            Local
          </SegmentedControl.Option>
        </SegmentedControl>
      </div>
    </fieldset>
  );
}

interface TimeHourControlsProps {
  timeFormat: TimeFormat;
  setTimeFormat: (v: TimeFormat) => void;
}

export function TimeHourControls({
  timeFormat,
  setTimeFormat,
}: TimeHourControlsProps): React.JSX.Element {
  return (
    <fieldset className={styles.columnGroup}>
      <legend className={styles.columnGroupLegend}>Time format</legend>
      <div className={styles.typeDisplayRadioGroup}>
        <SegmentedControl
          value={timeFormat}
          onValueChange={(v) => setTimeFormat(v as TimeFormat)}
        >
          <SegmentedControl.Option value="auto" indicator={<Targeted size={16} />}>
            Auto
          </SegmentedControl.Option>
          <SegmentedControl.Option value="12h" indicator={<Targeted size={16} />}>
            12h
          </SegmentedControl.Option>
          <SegmentedControl.Option value="24h" indicator={<Targeted size={16} />}>
            24h
          </SegmentedControl.Option>
        </SegmentedControl>
      </div>
    </fieldset>
  );
}

interface FormatDrawerProps {
  columnState: SharedColumnState;
}

export function FormatDrawer({ columnState }: FormatDrawerProps): React.JSX.Element {
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
    timeZone,
    setTimeZone,
    resetTimeZone,
    timeFormat,
    setTimeFormat,
    resetTimeFormat,
  } = columnState;

  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          Format
        </Button>
      }
      title="Format"
    >
      <fieldset className={styles.columnFieldset}>
        <TypeFormatControls
          typeDisplay={typeDisplay}
          setTypeDisplay={setTypeDisplay}
          showTypeIcon={showTypeIcon}
          setShowTypeIcon={setShowTypeIcon}
        />
        <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />
        <TimeFormatControls timeZone={timeZone} setTimeZone={setTimeZone} />
        <TimeHourControls timeFormat={timeFormat} setTimeFormat={setTimeFormat} />
        <div className={styles.columnActions}>
          <Button
            variant="ghost"
            onClick={() => {
              resetTypeDisplay();
              resetDayFormat();
              resetTimeZone();
              resetTimeFormat();
            }}
          >
            Reset
          </Button>
        </div>
      </fieldset>
    </Drawer>
  );
}
