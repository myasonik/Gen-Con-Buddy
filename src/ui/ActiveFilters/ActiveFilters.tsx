import type { SearchParams } from '../../utils/types'
import { type ActiveFilter, getActiveFilters } from './getActiveFilters'
import { Button } from '../Button/Button'
import styles from './ActiveFilters.module.css'

interface ActiveFiltersProps {
  searchParams: SearchParams
  onRemove: (filter: ActiveFilter) => void
}

export function ActiveFilters({ searchParams, onRemove }: ActiveFiltersProps): JSX.Element | null {
  const filters = getActiveFilters(searchParams)
  if (filters.length === 0) {
    return null
  }

  return (
    <ul className={styles.bar} aria-label="Active filters">
      {filters.map((filter) => (
        <li key={filter.id}>
          <Button variant="ghost" className={styles.chip} onClick={() => onRemove(filter)}>
            {filter.label} <span aria-hidden="true">×</span>
          </Button>
        </li>
      ))}
    </ul>
  )
}
