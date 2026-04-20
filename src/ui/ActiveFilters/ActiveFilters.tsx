import type { SearchParams } from "../../utils/types";
import { getActiveFilters } from "./getActiveFilters";
import styles from "./ActiveFilters.module.css";

interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (key: keyof SearchParams) => void;
}

export function ActiveFilters({ searchParams, onRemove }: ActiveFiltersProps) {
  const filters = getActiveFilters(searchParams);
  if (filters.length === 0) return null;

  return (
    <ul className={styles.bar} aria-label="Active filters">
      {filters.map(({ key, label }) => (
        <li key={key}>
          <button
            type="button"
            className={styles.chip}
            onClick={() => onRemove(key)}
          >
            {label} <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
