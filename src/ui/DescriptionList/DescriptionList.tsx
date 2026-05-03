import React, { type ReactNode } from "react";
import { clsx } from "clsx";
import { Wanted } from "../icons/Wanted";
import styles from "./DescriptionList.module.css";

interface DescriptionListProps {
  children: ReactNode;
  className?: string;
}

export function DescriptionList({ children, className }: DescriptionListProps): React.JSX.Element {
  return <dl className={[styles.list, className].filter(Boolean).join(" ")}>{children}</dl>;
}

interface DescriptionItemProps {
  term: ReactNode;
  children?: ReactNode;
  span?: "full";
  className?: string;
}

export function DescriptionItem({
  term,
  children,
  span,
  className,
}: DescriptionItemProps): React.JSX.Element {
  const isEmpty = children === null || children === undefined || children === "";

  return (
    <div data-span={span} className={clsx(span === "full" ? styles.full : undefined, className)}>
      <dt className={styles.dt}>{term}</dt>
      <dd className={styles.dd}>
        {isEmpty ? (
          <span className={styles.empty}>
            <Wanted size={28} />
            <span className="sr-only">not available</span>
          </span>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}
