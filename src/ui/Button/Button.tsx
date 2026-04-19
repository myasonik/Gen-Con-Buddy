import React from "react";
import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import styles from "./Button.module.css";

export const BUTTON_VARIANTS = ["primary", "secondary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", type = "button", className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[styles.button, styles[variant], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);

interface LinkButtonProps extends Omit<LinkProps, "className"> {
  variant?: ButtonVariant;
  className?: string;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ variant = "secondary", className, ...props }, ref) {
    return (
      <Link
        ref={ref}
        className={[styles.button, styles[variant], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);
