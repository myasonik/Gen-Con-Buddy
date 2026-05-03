import React from "react";
import styles from "./Chip.module.css";

export type ChipTone = "neutral" | "accent" | "jade" | "cobalt" | "amber" | "error";
export type ChipSize = "sm" | "md";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: ChipTone;
  icon?: React.ReactNode;
  onRemove?: () => void;
  /** Override the accessible label for the remove button. Defaults to the string content of children. */
  removeLabel?: string;
  size?: ChipSize;
  children: React.ReactNode;
}

function toRemoveLabel(children: React.ReactNode, removeLabel?: string): string {
  if (removeLabel != null) { return removeLabel; }
  if (typeof children === "string") { return children; }
  if (typeof children === "number") { return String(children); }
  if (Array.isArray(children)) {
    const first = children.find((c) => typeof c === "string" || typeof c === "number");
    if (first != null) { return String(first); }
  }
  return "";
}

export function Chip({
  tone,
  icon,
  onRemove,
  removeLabel,
  size = "md",
  children,
  ...rest
}: ChipProps): React.JSX.Element {
  return (
    <span className={styles.chip} data-tone={tone} data-size={size} {...rest}>
      {icon != null && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {onRemove != null && (
        <button
          type="button"
          className={styles.remove}
          aria-label={`Remove ${toRemoveLabel(children, removeLabel)}`}
          onClick={onRemove}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}
