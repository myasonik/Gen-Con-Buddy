import React from "react";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import styles from "./SegmentedControl.module.css";

type Variant = "default" | "menu";

const SegmentedControlContext = React.createContext<Variant>("default");

interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  variant?: Variant;
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
  const variant = React.useContext(SegmentedControlContext);

  if (variant === "menu") {
    return (
      <label className={styles.menuOption}>
        <Radio.Root value={value} className={styles.menuRadioRoot}>
          <Radio.Indicator className={styles.menuRadioIndicator} />
        </Radio.Root>
        {children}
      </label>
    );
  }

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
  variant = "default",
}: SegmentedControlProps): React.JSX.Element {
  const rootClass = variant === "menu" ? styles.menuRoot : styles.root;
  return (
    <SegmentedControlContext.Provider value={variant}>
      <RadioGroup
        value={value}
        onValueChange={(v) => onValueChange(v as string)}
        className={rootClass}
        data-variant={variant}
      >
        {children}
      </RadioGroup>
    </SegmentedControlContext.Provider>
  );
}

export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Option: SegmentedControlOption,
});
