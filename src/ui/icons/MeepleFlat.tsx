// src/ui/icons/MeepleFlat.tsx
interface MeepleFlatProps {
  className?: string;
  "aria-hidden"?: true | "true";
  "data-testid"?: string;
}

export function MeepleFlat({
  className,
  "aria-hidden": ariaHidden,
  "data-testid": testId,
}: MeepleFlatProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden={ariaHidden}
      data-testid={testId}
    >
      <path
        fill="currentColor"
        d="M 214,169 C 164,194 96,219 80,248 C 67,278 96,295 130,282 C 159,269 189,265 193,278 L 189,320 L 126,421 L 206,421 L 256,341 L 306,421 L 386,421 L 323,320 L 319,278 C 323,265 353,269 382,282 C 416,295 445,278 432,248 C 416,219 348,194 298,169 C 311,143 319,114 319,93 A 63 63 0 0 0 193,93 C 193,114 201,143 214,169 Z"
      />
    </svg>
  );
}
