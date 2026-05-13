import React from "react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { Sun } from "../../ui/icons/Sun";
import { Moon } from "../../ui/icons/Moon";
import { Eclipse } from "../../ui/icons/Eclipse";
import { announce } from "../../lib/announce";
import type { ThemePreference } from "../../hooks/useTheme";
import { ThemeRadioGroup } from "./ThemeRadioGroup";
import styles from "./ThemePopover.module.css";

interface ThemePopoverProps {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
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

export function ThemePopover({
  theme,
  resolvedTheme,
  setTheme,
}: ThemePopoverProps): React.JSX.Element {
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
            <ThemeRadioGroup
              theme={theme}
              resolvedTheme={resolvedTheme}
              onValueChange={handleChange}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
