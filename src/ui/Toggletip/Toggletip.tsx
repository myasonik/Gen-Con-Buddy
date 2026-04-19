import { useState, useEffect } from "react";
import styles from "./Toggletip.module.css";

interface ToggletipProps {
  label: string;
  message: string;
}

export function Toggletip({ label, message }: ToggletipProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        aria-label={label}
        className={styles.button}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" className={styles.tooltip}>
          {message}
        </span>
      )}
    </span>
  );
}
