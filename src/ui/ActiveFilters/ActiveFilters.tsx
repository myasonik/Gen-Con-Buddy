import React from "react";
import type { SearchParams } from "../../utils/types";
import { type ActiveFilter, getActiveFilters } from "./getActiveFilters";
import { Chip } from "../Chip/Chip";
import styles from "./ActiveFilters.module.css";

interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (filter: ActiveFilter) => void;
}

export function ActiveFilters({
  searchParams,
  onRemove,
}: ActiveFiltersProps): React.JSX.Element | null {
  const filters = getActiveFilters(searchParams);
  if (filters.length === 0) {
    return null;
  }

  return (
    <ul className={styles.bar} aria-label="Active filters">
      {filters.map((filter) => (
        <li key={filter.id}>
          <Chip
            tone="accent"
            icon={filter.icon ? <filter.icon size={12} /> : undefined}
            onRemove={() => onRemove(filter)}
          >
            {filter.label}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
