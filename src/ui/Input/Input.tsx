import React from "react";
import clsx from "clsx";
import styles from "./Input.module.css";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithRef<"input">>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(styles.input, className)} {...props} />;
  },
);
