import React from "react";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Sun, Moon } from "lucide-react";
import { Eclipse } from "../../ui/icons/Eclipse";
import type { ThemePreference } from "../../hooks/useTheme";
import styles from "./ThemePopover.module.css";

interface ThemeRadioGroupProps {
  theme: ThemePreference;
  onValueChange: (v: ThemePreference) => void;
}

export function ThemeRadioGroup({
  theme,
  onValueChange,
}: ThemeRadioGroupProps): React.JSX.Element {
  return (
    <fieldset className={styles.fieldset}>
      <legend className="sr-only">Theme</legend>
      <RadioGroup
        value={theme}
        onValueChange={(v) => onValueChange(v as ThemePreference)}
        className={styles.radioGroup}
      >
        <label className={styles.option}>
          <Radio.Root value="light" className={styles.radio}>
            <Radio.Indicator className={styles.radioIndicator} />
          </Radio.Root>
          <Sun size={14} aria-hidden="true" />
          <span>Light</span>
        </label>
        <label className={styles.option}>
          <Radio.Root value="dark" className={styles.radio}>
            <Radio.Indicator className={styles.radioIndicator} />
          </Radio.Root>
          <Moon size={14} aria-hidden="true" />
          <span>Dark</span>
        </label>
        <label className={styles.option}>
          <Radio.Root value="auto" className={styles.radio}>
            <Radio.Indicator className={styles.radioIndicator} />
          </Radio.Root>
          <Eclipse size={14} aria-hidden="true" />
          <span>Auto</span>
        </label>
      </RadioGroup>
    </fieldset>
  );
}
