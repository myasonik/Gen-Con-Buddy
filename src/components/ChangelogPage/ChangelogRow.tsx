import { format } from "date-fns";
import type { ChangelogEntry, ChangelogSummary } from "../../utils/types";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import styles from "./ChangelogRow.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogRowProps {
  summary: ChangelogSummary;
  entry: EntryValue;
  onOpen: () => void;
}

export function ChangelogRow({ summary, entry, onOpen }: ChangelogRowProps) {
  return (
    <details
      className={styles.row}
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) onOpen();
      }}
    >
      <summary className={styles.summary}>
        <time dateTime={summary.date} className={styles.date}>
          {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
        </time>
        <span className={styles.counts}>
          <span>{summary.createdCount} created</span>
          <span>{summary.updatedCount} updated</span>
          <span>{summary.deletedCount} deleted</span>
        </span>
      </summary>
      <ChangelogEntryPanel entry={entry} />
    </details>
  );
}
