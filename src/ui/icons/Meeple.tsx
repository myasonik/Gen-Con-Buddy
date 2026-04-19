// src/ui/icons/Meeple.tsx
interface MeepleProps {
  frontFill?: string;
  shadowFill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: true | "true";
}

const PATH =
  "M 214,169 C 164,194 96,219 80,248 C 67,278 96,295 130,282 C 159,269 189,265 193,278 L 189,320 L 126,421 L 206,421 L 256,341 L 306,421 L 386,421 L 323,320 L 319,278 C 323,265 353,269 382,282 C 416,295 445,278 432,248 C 416,219 348,194 298,169 C 311,143 319,114 319,93 A 63 63 0 0 0 193,93 C 193,114 201,143 214,169 Z";

export function Meeple({
  frontFill = "white",
  shadowFill = "black",
  stroke = "black",
  strokeWidth = 12,
  className,
  "aria-hidden": ariaHidden,
}: MeepleProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d={PATH} fill={shadowFill} transform="translate(-30,-30)" />
      <path
        d={PATH}
        fill={frontFill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
