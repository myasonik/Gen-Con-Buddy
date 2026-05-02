import { Popover } from "@base-ui/react/popover";
import { Button } from "../Button/Button";
import { QuestionMark } from "../icons/QuestionMark";
import styles from "./Toggletip.module.css";

interface ToggletipProps {
  label: string;
  message: string;
}

export function Toggletip({ label, message }: ToggletipProps): JSX.Element {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button icon />} aria-label={label}>
        <QuestionMark size={16} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.tooltip}>{message}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
