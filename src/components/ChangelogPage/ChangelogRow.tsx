import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { ChangelogSummary } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import styles from "./ChangelogRow.module.css";

interface ChangelogRowProps {
  summary: ChangelogSummary;
  onOpen: () => void;
}

export function ChangelogRow({ summary, onOpen }: ChangelogRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: entry, isError } = useQuery({
    queryKey: ["changelog", "entry", summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  });

  return (
    <details
      className={styles.row}
      onToggle={(e) => {
        const open = (e.currentTarget as HTMLDetailsElement).open;
        setIsOpen(open);
        if (open) onOpen();
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
      <ChangelogEntryPanel entry={isError ? "error" : entry} />
    </details>
  );
}
