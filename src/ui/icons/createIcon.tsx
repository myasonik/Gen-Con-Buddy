import React from "react";
import type { LucideProps } from "lucide-react";

type IconProps = Omit<LucideProps, "ref"> &
  React.RefAttributes<SVGSVGElement> & {
    "data-testid"?: string;
  };

const hasA11yProp = (props: object): boolean =>
  Object.keys(props).some((k) => k.startsWith("aria-") || k === "role" || k === "title");

export function createIcon(
  displayName: string,
  viewBox: string,
  children: React.ReactNode,
): React.ForwardRefExoticComponent<IconProps> {
  const Component = React.forwardRef<SVGSVGElement, Omit<IconProps, "ref">>(
    (
      { size = 24, color = "currentColor", absoluteStrokeWidth: _asw, className, ...props },
      ref,
    ) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        fill={color}
        className={className}
        {...(!hasA11yProp(props) && { "aria-hidden": "true" })}
        {...props}
      >
        {children}
      </svg>
    ),
  );
  Component.displayName = displayName;
  return Component;
}
