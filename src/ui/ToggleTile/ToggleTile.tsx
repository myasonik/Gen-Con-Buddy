import React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { MeepleFlat } from "../icons/MeepleFlat";
import styles from "./ToggleTile.module.css";

export interface ToggleTileProps extends Toggle.Props {}

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(
  function ToggleTile({ className, children, ...props }, ref) {
    return (
      <Toggle
        ref={ref}
        className={[styles.tile, className].filter(Boolean).join(" ")}
        {...props}
      >
        <MeepleFlat className={styles.meepleSlot} aria-hidden="true" />
        {children}
      </Toggle>
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
