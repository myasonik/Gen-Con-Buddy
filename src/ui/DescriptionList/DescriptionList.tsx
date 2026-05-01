import type { ReactNode } from "react";
import { clsx } from "clsx";
import styles from "./DescriptionList.module.css";

interface DescriptionListProps {
  children: ReactNode;
  className?: string;
}

export function DescriptionList({ children, className }: DescriptionListProps): JSX.Element {
  return <dl className={[styles.list, className].filter(Boolean).join(" ")}>{children}</dl>;
}

interface DescriptionItemProps {
  term: ReactNode;
  children: ReactNode;
  span?: "full";
  className?: string;
}

export function DescriptionItem({
  term,
  children,
  span,
  className,
}: DescriptionItemProps): JSX.Element {
  return (
    <div data-span={span} className={clsx(span === "full" ? styles.full : undefined, className)}>
      <dt>{term}</dt>
      <dd className={styles.dd}>{children}</dd>
    </div>
  );
}
