import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogEntry } from "../../utils/types";
import { filterChangelogEvents } from "../../utils/filterChangelogEvents";

interface Counts {
  created: number;
  updated: number;
  deleted: number;
}

export type ChangelogEntryFilterState =
  | { kind: "idle" }
  | { kind: "unknown" }
  | { kind: "active"; filtered: Counts; hasMatches: boolean };

function isFilterActive(filter: SearchFormValues): boolean {
  return Boolean(filter.eventType || filter.days || filter.timeStart || filter.timeEnd);
}

export function useChangelogEntryFilterState(
  entryId: string,
  activeFilter: SearchFormValues | undefined,
): ChangelogEntryFilterState {
  const queryClient = useQueryClient();
  const filterActive = activeFilter !== undefined && isFilterActive(activeFilter);
  const cachedEntry = queryClient.getQueryData<ChangelogEntry>(["changelog", "entry", entryId]);

  return useMemo((): ChangelogEntryFilterState => {
    if (!filterActive || activeFilter === undefined) {
      return { kind: "idle" };
    }
    if (cachedEntry === undefined) {
      return { kind: "unknown" };
    }
    const created = filterChangelogEvents(cachedEntry.createdEvents, activeFilter);
    const updated = filterChangelogEvents(cachedEntry.updatedEvents, activeFilter);
    const deleted = filterChangelogEvents(cachedEntry.deletedEvents, activeFilter);
    return {
      kind: "active",
      filtered: { created: created.length, updated: updated.length, deleted: deleted.length },
      hasMatches: created.length > 0 || updated.length > 0 || deleted.length > 0,
    };
  }, [filterActive, cachedEntry, activeFilter]);
}
