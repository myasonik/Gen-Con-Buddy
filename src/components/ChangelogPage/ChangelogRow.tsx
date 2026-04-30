import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import type { ChangelogSummary } from '../../utils/types'
import { fetchChangelogEntry } from '../../utils/api'
import { ChangelogEntryPanel } from './ChangelogEntryPanel'
import type { SharedColumnState } from '../../ui/EventTable/EventTable'
import styles from './ChangelogRow.module.css'

interface ChangelogRowProps {
  summary: ChangelogSummary
  onOpen: () => void
  sharedColumnState: SharedColumnState
}

export function ChangelogRow({ summary, onOpen, sharedColumnState }: ChangelogRowProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const { data: entry, isError } = useQuery({
    queryKey: ['changelog', 'entry', summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  })

  return (
    <details
      className={`${styles.row} animates-details`}
      onToggle={(e) => {
        const { open } = e.currentTarget as HTMLDetailsElement
        setIsOpen(open)
        if (open) {
          onOpen()
        }
      }}
    >
      <summary className={styles.summary}>
        <time dateTime={summary.date} className={styles.date}>
          {format(new Date(summary.date), 'MMM d, yyyy h:mm a')}
        </time>
        <span className={styles.counts}>
          <span>{summary.createdCount} created</span>
          <span>{summary.updatedCount} updated</span>
          <span>{summary.deletedCount} deleted</span>
        </span>
      </summary>
      <ChangelogEntryPanel entry={isError ? 'error' : entry} sharedColumnState={sharedColumnState} />
    </details>
  )
}
