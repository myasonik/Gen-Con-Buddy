import React, { startTransition, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { ChangelogSummary, SearchFormValues } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../EventTable/types";
import { Collapsible } from "../../ui/Collapsible/Collapsible";
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
  activeFilter?: SearchFormValues;
}

export function ChangelogRow({
  position,
  openParam = [],
  navigate,
  summary,
  onOpen,
  sharedColumnState,
  activeFilter,
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
        resetScroll: false,
      });
    });
  }

  return (
    <Collapsible
      className={styles.row}
      triggerClassName={styles.summary}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        syncOpenToUrl(open);
        if (open) {
          onOpen();
        }
      }}
      trigger={
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
        activeFilter={activeFilter}
      />
    </Collapsible>
  );
}
