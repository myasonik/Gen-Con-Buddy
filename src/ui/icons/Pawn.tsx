import React from "react";

interface PawnProps {
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: true | "true";
}

export function Pawn({
  className,
  style,
  "aria-hidden": ariaHidden,
}: PawnProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 120"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      <circle cx="50" cy="28" r="18" fill="currentColor" />
      <path
        d="M 43,44 L 40,54 Q 20,62 18,90 L 18,110 L 82,110 L 82,90 Q 80,62 60,54 L 57,44 Z"
        fill="currentColor"
      />
    </svg>
  );
}
