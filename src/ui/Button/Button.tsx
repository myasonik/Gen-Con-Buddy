import React from "react";
import clsx from "clsx";
import { Button as BaseButton } from "@base-ui/react/button";
import styles from "./Button.module.css";

export const BUTTON_VARIANTS = ["primary", "secondary", "ghost"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_SIZES = ["default", "large"] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

interface ButtonProps extends Omit<React.ComponentPropsWithRef<typeof BaseButton>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  className?: string;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { variant, size, icon, className, ...props },
  ref,
) {
  const resolvedVariant = variant ?? (icon ? "secondary" : "primary");
  return (
    <BaseButton
      ref={ref}
      className={clsx(
        styles.button,
        styles[resolvedVariant],
        icon && styles.icon,
        size === "large" && styles.large,
        className,
      )}
      {...props}
    />
  );
});
