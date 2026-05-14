import React from "react";
import { Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { ThemeRadioGroup } from "../ThemePopover/ThemeRadioGroup";
import { announce } from "../../lib/announce";
import type { ThemePreference } from "../../hooks/useTheme";
import styles from "./MobileNav.module.css";

interface MobileNavProps {
  theme: ThemePreference;
  setTheme: (v: ThemePreference) => void;
}

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function MobileNav({ theme, setTheme }: MobileNavProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  function handleThemeChange(v: ThemePreference): void {
    setTheme(v);
    announce(`Theme: ${LABELS[v]}`);
    // Intentionally does not close — user may still want to navigate
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={<Button icon className={styles.trigger} />}
        aria-label="Navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            <Link
              to="/"
              className={styles.link}
              activeOptions={{ exact: true, includeSearch: false }}
              onClick={() => setOpen(false)}
            >
              Search
            </Link>
            <Link
              to="/changelog"
              className={styles.link}
              search={{
                open: [],
                eventType: undefined,
                days: undefined,
                timeStart: undefined,
                timeEnd: undefined,
              }}
              activeOptions={{ includeSearch: false }}
              onClick={() => setOpen(false)}
            >
              Changelog
            </Link>
            <hr className={styles.divider} />
            <ThemeRadioGroup
              theme={theme}
              onValueChange={handleThemeChange}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
