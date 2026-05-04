import React from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { D6Face } from "../icons/D6Face";
import styles from "./Checkbox.module.css";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onCheckedChange, label }: CheckboxProps): React.JSX.Element {
  return (
    <label className={styles.label}>
      <BaseCheckbox.Root
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value)}
        className={styles.root}
      >
        <BaseCheckbox.Indicator className={styles.indicator}>
          <D6Face size={16} />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <span className={styles.labelText}>{label}</span>
    </label>
  );
}
