import React from "react";
import { Popover } from "@base-ui/react/popover";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Button } from "../../ui/Button/Button";
import { Sun } from "../../ui/icons/Sun";
import { Moon } from "../../ui/icons/Moon";
import { Eclipse } from "../../ui/icons/Eclipse";
import { announce } from "../../lib/announce";
import type { ThemePreference } from "../../hooks/useTheme";
import styles from "./ThemePopover.module.css";

interface ThemePopoverProps {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (v: ThemePreference) => void;
}

function ThemeIcon({ preference }: { preference: ThemePreference }): React.JSX.Element {
  if (preference === "light") return <Sun size={16} aria-hidden="true" />;
  if (preference === "dark") return <Moon size={16} aria-hidden="true" />;
  return <Eclipse size={16} aria-hidden="true" />;
}

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function ThemePopover({
  theme,
  resolvedTheme,
  setTheme,
}: ThemePopoverProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  function handleChange(value: string): void {
    const next = value as ThemePreference;
    setTheme(next);
    announce(`Theme: ${LABELS[next]}`);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={<Button icon className={styles.trigger} />}
        aria-label={`Theme: ${LABELS[theme]}`}
      >
        <ThemeIcon preference={theme} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            <fieldset className={styles.fieldset}>
              <legend className="sr-only">Theme</legend>
              <RadioGroup value={theme} onValueChange={handleChange} className={styles.radioGroup}>
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
              {theme === "auto" && (
                <p className={styles.resolvedNote} aria-hidden="true">
                  Currently: {resolvedTheme === "dark" ? "Dark" : "Light"}
                </p>
              )}
            </fieldset>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
