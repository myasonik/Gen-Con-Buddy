import type { ReactNode, ReactEventHandler } from "react";
import { useAnimatedDetails } from "../../hooks/useAnimatedDetails";
import styles from "./AnimatedDetails.module.css";

interface AnimatedDetailsProps {
  summary: ReactNode;
  summaryClassName?: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
  onToggle?: ReactEventHandler<HTMLDetailsElement>;
}

export function AnimatedDetails({
  summary,
  summaryClassName,
  children,
  className,
  open,
  onToggle,
}: AnimatedDetailsProps): JSX.Element {
  const { ref, contentRef, onSummaryClick } = useAnimatedDetails();

  return (
    <details
      ref={ref}
      className={`${styles.details}${className ? ` ${className}` : ""}`}
      open={open}
      onToggle={onToggle}
    >
      <summary className={summaryClassName} onClick={onSummaryClick}>
        {summary}
      </summary>
      <div ref={contentRef} className={styles.content}>
        {children}
      </div>
    </details>
  );
}
