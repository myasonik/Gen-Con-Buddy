import { Popover } from "@base-ui/react/popover";
import styles from "./Toggletip.module.css";

interface ToggletipProps {
  label: string;
  message: string;
}

export function Toggletip({ label, message }: ToggletipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger aria-label={label} className={styles.button}>
        ?
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup className={styles.tooltip}>{message}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
