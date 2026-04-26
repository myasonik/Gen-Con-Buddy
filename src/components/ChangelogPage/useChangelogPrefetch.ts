import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ChangelogEntry, ChangelogSummary } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";

type CacheValue = ChangelogEntry | "loading" | "error";

export function useChangelogPrefetch(summaries: ChangelogSummary[]) {
  const cache = useRef<Map<string, CacheValue>>(new Map());
  const summariesRef = useRef(summaries);
  summariesRef.current = summaries;
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const fetchOne = useCallback(async (id: string): Promise<void> => {
    const current = cache.current.get(id);
    // Skip if already loading or successfully fetched; retry if "error"
    if (current === "loading" || (current !== undefined && current !== "error"))
      return;
    cache.current.set(id, "loading");
    forceUpdate();
    try {
      const entry = await fetchChangelogEntry(id);
      cache.current.set(id, entry);
    } catch {
      cache.current.set(id, "error");
    }
    forceUpdate();
  }, []);

  // Prefetch entry[0] as soon as the summary list is available
  useEffect(() => {
    if (summaries.length > 0) {
      void fetchOne(summaries[0].id);
    }
  }, [summaries, fetchOne]);

  const getEntry = useCallback(
    (id: string): CacheValue | undefined => cache.current.get(id),
    [],
  );

  const openEntry = useCallback(
    (index: number): void => {
      const list = summariesRef.current;
      const summary = list[index];
      if (!summary) return;

      const current = cache.current.get(summary.id);
      const isReady =
        current !== undefined && current !== "loading" && current !== "error";

      if (isReady) {
        // Already fetched — background-fetch next
        if (index + 1 < list.length) void fetchOne(list[index + 1].id);
      } else {
        // Fetch target first, then fill in surrounding entries
        void fetchOne(summary.id).then(() => {
          for (let j = 0; j < index; j++) void fetchOne(list[j].id);
          if (index + 1 < list.length) void fetchOne(list[index + 1].id);
        });
      }
    },
    [fetchOne],
  );

  return { getEntry, openEntry };
}
