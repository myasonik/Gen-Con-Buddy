import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
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
}: ColumnResizeDialogProps) {
  const [value, setValue] = useState(String(currentWidth));

  return (
    <Dialog.Root
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <Dialog.Title className={styles.title}>
            Resize {columnName}
          </Dialog.Title>
          <div className={styles.field}>
            <label htmlFor="resize-width-input" className={styles.label}>
              Width (px)
            </label>
            <input
              id="resize-width-input"
              type="number"
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={() => onApply(Number(value))}
            >
              Apply
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
