import React from "react";
import styles from "./Badge.module.css";
import {
  EVENT_TYPE_COLORS,
  DAY_COLORS,
  EXPERIENCE_COLORS,
} from "../../utils/conceptColors";
import type { ConceptColor } from "../../utils/conceptColors";

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
  concept,
  value,
  children,
  className,
}: ConceptBadgeProps) {
  let colors: ConceptColor | undefined;
  if (concept === "eventType") colors = EVENT_TYPE_COLORS[value];
  else if (concept === "day") colors = DAY_COLORS[value];
  else if (concept === "experience") colors = EXPERIENCE_COLORS[value];

  const style = colors
    ? ({
        "--concept-color": colors.color,
        "--concept-bg": colors.bg,
      } as React.CSSProperties)
    : undefined;

  return (
    <span
      className={[styles.conceptBadge, className].filter(Boolean).join(" ")}
      style={style}
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
