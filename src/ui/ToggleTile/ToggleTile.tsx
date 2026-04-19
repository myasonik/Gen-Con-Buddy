import React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import styles from "./ToggleTile.module.css";

export interface ToggleTileProps extends Toggle.Props {}

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(
  function ToggleTile({ className, ...props }, ref) {
    return (
      <Toggle
        ref={ref}
        className={[styles.tile, className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  },
);

export interface ToggleTileGroupProps extends ToggleGroup.Props {}

export function ToggleTileGroup({
  className,
  multiple = true,
  ...props
}: ToggleTileGroupProps) {
  return (
    <ToggleGroup
      multiple={multiple}
      className={[styles.group, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
