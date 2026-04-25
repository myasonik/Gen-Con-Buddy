import React from "react";
import styles from "./Badge.module.css";

export const BADGE_VARIANTS = ["filled", "outline"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "filled", className }: BadgeProps) {
  return (
    <span
      data-variant={variant}
      className={[styles.badge, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

export interface ConceptBadgeProps {
  concept: "eventType" | "day" | "experience";
  value: string;
  children?: React.ReactNode;
  className?: string;
}

export function ConceptBadge({
  value,
  children,
  className,
}: ConceptBadgeProps) {
  return (
    <span
      className={[styles.conceptBadge, className].filter(Boolean).join(" ")}
    >
      {children ?? value}
    </span>
  );
}

interface BoolBadgeProps {
  value: string | boolean;
  className?: string;
}

export function BoolBadge({ value, className }: BoolBadgeProps) {
  const isYes =
    value === true ||
    (typeof value === "string" && value.toLowerCase() === "yes");
  // Gen Con API returns "Yes"/"No" strings; true/false booleans also accepted
  return (
    <span
      className={[isYes ? styles.boolYes : styles.boolNo, className]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true">{isYes ? "✓" : "—"}</span>
      <span className="sr-only">{isYes ? "yes" : "no"}</span>
    </span>
  );
}
