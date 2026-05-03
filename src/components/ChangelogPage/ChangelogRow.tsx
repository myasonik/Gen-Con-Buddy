import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { ChangelogSummary } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../../ui/EventTable/types";
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { Chip } from "../../ui/Chip/Chip";
import styles from "./ChangelogRow.module.css";

interface ChangelogRowProps {
  summary: ChangelogSummary;
  onOpen: () => void;
  sharedColumnState: SharedColumnState;
}

export function ChangelogRow({
  summary,
  onOpen,
  sharedColumnState,
}: ChangelogRowProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { data: entry, isError } = useQuery({
    queryKey: ["changelog", "entry", summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  });

  return (
    <AnimatedDetails
      className={styles.row}
      summaryClassName={styles.summary}
      onToggle={(e) => {
        const { open } = e.currentTarget as HTMLDetailsElement;
        setIsOpen(open);
        if (open) {
          onOpen();
        }
      }}
      summary={
        <>
          <time dateTime={summary.date} className={styles.date}>
            {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
          </time>
          <span className={styles.counts}>
            <Chip tone="jade">{summary.createdCount} created</Chip>
            <Chip tone="cobalt">{summary.updatedCount} updated</Chip>
            <Chip tone="amber">{summary.deletedCount} deleted</Chip>
          </span>
        </>
      }
    >
      <ChangelogEntryPanel
        entry={isError ? "error" : entry}
        sharedColumnState={sharedColumnState}
      />
    </AnimatedDetails>
  );
}
