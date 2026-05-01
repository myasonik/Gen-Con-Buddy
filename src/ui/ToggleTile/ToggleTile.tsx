import React from "react";
import clsx from "clsx";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import styles from "./ToggleTile.module.css";

export type ToggleTileProps = Toggle.Props;

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(function ToggleTile(
  { className, children, ...props },
  ref,
) {
  return (
    <Toggle ref={ref} className={clsx(styles.tile, className)} {...props}>
      {children}
    </Toggle>
  );
});

export type ToggleTileGroupProps = ToggleGroup.Props;

export function ToggleTileGroup({
  className,
  multiple = true,
  ...props
}: ToggleTileGroupProps): JSX.Element {
  return <ToggleGroup multiple={multiple} className={clsx(styles.group, className)} {...props} />;
}
