import React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import styles from "./Button.module.css";

export const BUTTON_VARIANTS = ["primary", "secondary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

interface ButtonProps extends Omit<
  React.ComponentPropsWithRef<typeof BaseButton>,
  "className"
> {
  variant?: ButtonVariant;
  className?: string;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  function Button({ variant = "primary", className, ...props }, ref) {
    return (
      <BaseButton
        ref={ref}
        className={[styles.button, styles[variant], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);
