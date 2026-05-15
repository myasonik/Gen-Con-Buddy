import React from "react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { Sun, Moon } from "lucide-react";
import { Eclipse } from "../../ui/icons/Eclipse";
import { announce } from "../../lib/announce";
import type { ThemePreference } from "../../hooks/useTheme";
import { SegmentedControl } from "../../ui/SegmentedControl/SegmentedControl";
import styles from "./ThemePopover.module.css";

interface ThemePopoverProps {
  theme: ThemePreference;
  setTheme: (v: ThemePreference) => void;
}

function ThemeIcon({ preference }: { preference: ThemePreference }): React.JSX.Element {
  if (preference === "light") {
    return <Sun size={16} aria-hidden="true" />;
  }
  if (preference === "dark") {
    return <Moon size={16} aria-hidden="true" />;
  }
  return <Eclipse size={16} aria-hidden="true" />;
}

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function ThemePopover({ theme, setTheme }: ThemePopoverProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  function handleChange(v: ThemePreference): void {
    setTheme(v);
    announce(`Theme: ${LABELS[v]}`);
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
              <SegmentedControl
                variant="menu"
                value={theme}
                onValueChange={(v) => handleChange(v as ThemePreference)}
              >
                <SegmentedControl.Option value="light">
                  <Sun size={14} aria-hidden="true" />
                  Light
                </SegmentedControl.Option>
                <SegmentedControl.Option value="dark">
                  <Moon size={14} aria-hidden="true" />
                  Dark
                </SegmentedControl.Option>
                <SegmentedControl.Option value="auto">
                  <Eclipse size={14} aria-hidden="true" />
                  Auto
                </SegmentedControl.Option>
              </SegmentedControl>
            </fieldset>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
