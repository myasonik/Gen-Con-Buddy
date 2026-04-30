import type { ChangelogEntry } from '../../utils/types'
import { EventTable, type SharedColumnState } from '../../ui/EventTable/EventTable'
import styles from './ChangelogEntryPanel.module.css'

type EntryValue = ChangelogEntry | 'loading' | 'error' | undefined

interface ChangelogEntryPanelProps {
  entry: EntryValue
  sharedColumnState: SharedColumnState
}

export function ChangelogEntryPanel({ entry, sharedColumnState }: ChangelogEntryPanelProps): JSX.Element {
  if (entry === undefined || entry === 'loading') {
    return (
      <p className={styles.status} aria-busy="true">
        Loading…
      </p>
    )
  }

  if (entry === 'error') {
    return (
      <p className={styles.status}>Could not load this entry. Collapse and re-expand to retry.</p>
    )
  }

  return (
    <div className={styles.panel}>
      {entry.createdEvents.length > 0 && (
        <details open className={`${styles.group} animates-details`}>
          <summary>Created ({entry.createdEvents.length})</summary>
          <EventTable events={entry.createdEvents} sharedColumnState={sharedColumnState} showColumnControls={false} />
        </details>
      )}
      {entry.updatedEvents.length > 0 && (
        <details open className={`${styles.group} animates-details`}>
          <summary>Updated ({entry.updatedEvents.length})</summary>
          <EventTable events={entry.updatedEvents} sharedColumnState={sharedColumnState} showColumnControls={false} />
        </details>
      )}
      {entry.deletedEvents.length > 0 && (
        <details open className={`${styles.group} animates-details`}>
          <summary>Deleted ({entry.deletedEvents.length})</summary>
          <EventTable events={entry.deletedEvents} sharedColumnState={sharedColumnState} showColumnControls={false} />
        </details>
      )}
    </div>
  )
}
