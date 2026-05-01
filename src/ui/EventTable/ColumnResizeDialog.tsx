import { useState, useId } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "../Button/Button";
import styles from "./ColumnResizeDialog.module.css";

interface ColumnResizeDialogProps {
  columnName: string;
  currentWidth: number;
  onApply: (width: number) => void;
  onClose: () => void;
}

export function ColumnResizeDialog({
  columnName,
  currentWidth,
  onApply,
  onClose,
}: ColumnResizeDialogProps): JSX.Element {
  const [value, setValue] = useState(String(currentWidth));
  const inputId = useId();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <Dialog.Title className={styles.title}>Resize {columnName}</Dialog.Title>
          <div className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              Width (px)
            </label>
            <input
              id={inputId}
              type="number"
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply(Number(value));
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
