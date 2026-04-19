import React from "react";
import styles from "./ToggleTile.module.css";

interface ToggleTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(
  function ToggleTile({ selected = false, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={[
          styles.tile,
          selected ? styles.selected : undefined,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);
