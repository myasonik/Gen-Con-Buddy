import React from "react";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import styles from "./SegmentedControl.module.css";

interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface SegmentedControlOptionProps {
  value: string;
  children: React.ReactNode;
  indicator?: React.ReactNode;
}

function SegmentedControlOption({
  value,
  children,
  indicator,
}: SegmentedControlOptionProps): React.JSX.Element {
  return (
    <label className={styles.option}>
      <Radio.Root value={value} className={styles.radioRoot}>
        <Radio.Indicator className={styles.radioIndicator}>{indicator}</Radio.Indicator>
      </Radio.Root>
      <span className={styles.optionLabel}>{children}</span>
    </label>
  );
}

function SegmentedControlRoot({
  value,
  onValueChange,
  children,
}: SegmentedControlProps): React.JSX.Element {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      className={styles.root}
    >
      {children}
    </RadioGroup>
  );
}

export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Option: SegmentedControlOption,
});
