import React, { startTransition, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { ChangelogSummary } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../EventTable/types";
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { Chip } from "../../ui/Chip/Chip";
import { parseOpenParam, serializeOpenParam } from "./openParam";
import type { NavigateFn } from "@tanstack/react-router";
import styles from "./ChangelogRow.module.css";

interface ChangelogRowProps {
  position?: number;
  openParam?: string[];
  navigate?: NavigateFn;
  summary: ChangelogSummary;
  onOpen: () => void;
  sharedColumnState: SharedColumnState;
}

export function ChangelogRow({
  position,
  openParam = [],
  navigate,
  summary,
  onOpen,
  sharedColumnState,
}: ChangelogRowProps): React.JSX.Element {
  const openMap = parseOpenParam(openParam);
  const [isOpen, setIsOpen] = useState(() => position !== undefined && openMap.has(position));
  const { data: entry, isError } = useQuery({
    queryKey: ["changelog", "entry", summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  });

  function syncOpenToUrl(nowOpen: boolean): void {
    if (!navigate || position === undefined) {
      return;
    }
    const newMap = new Map(openMap);
    if (nowOpen) {
      newMap.set(position, newMap.get(position) ?? new Map());
    } else {
      newMap.delete(position);
    }
    startTransition(() => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, open: serializeOpenParam(newMap) }),
        replace: true,
      });
    });
  }

  return (
    <AnimatedDetails
      className={styles.row}
      summaryClassName={styles.summary}
      open={isOpen}
      onToggle={(e) => {
        const { open } = e.currentTarget as HTMLDetailsElement;
        // jsdom spuriously fires toggle on an outer <details> when a nested <details> toggles;
        // the state hasn't actually changed in that case, so guard against it.
        if (open === isOpen) {
          return;
        }
        setIsOpen(open);
        syncOpenToUrl(open);
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
        openParam={openParam}
        position={position}
        navigate={navigate}
      />
    </AnimatedDetails>
  );
}
