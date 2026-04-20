import React from "react";
import type { SearchParams } from "../../utils/types";
import type { ActiveFilter } from "./getActiveFilters";
import { getActiveFilters } from "./getActiveFilters";
import styles from "./ActiveFilters.module.css";

interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (filter: ActiveFilter) => void;
}

export function ActiveFilters({ searchParams, onRemove }: ActiveFiltersProps) {
  const filters = getActiveFilters(searchParams);
  if (filters.length === 0) return null;

  return (
    <ul className={styles.bar} aria-label="Active filters">
      {filters.map((filter) => (
        <li key={filter.id}>
          <button
            type="button"
            className={styles.chip}
            style={
              filter.colors
                ? ({
                    "--chip-color": filter.colors.color,
                    "--chip-bg": filter.colors.bg,
                  } as React.CSSProperties)
                : undefined
            }
            onClick={() => onRemove(filter)}
          >
            {filter.label} <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
