import React, { useEffect, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NavigateFn } from "@tanstack/react-router";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ColumnControlsPanel } from "../EventTable/ColumnControlsPanel";
import { fetchChangelogEntry, fetchChangelogList } from "../../utils/api";
import { SearchForm } from "../SearchForm/SearchForm";
import type { SearchFormValues } from "../../utils/types";
import styles from "./ChangelogPage.module.css";
import { ChangelogRow } from "./ChangelogRow";

interface ChangelogPageProps {
  openParam?: string[];
  navigate?: NavigateFn;
  activeFilter?: SearchFormValues;
}

export function ChangelogPage({
  openParam = [],
  navigate,
  activeFilter: activeFilterProp,
}: ChangelogPageProps): React.JSX.Element {
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const sharedColumnState = useSharedColumnState();
  const {
    data: summaries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["changelog", "list"],
    queryFn: () => fetchChangelogList(),
  });

  useEffect(() => {
    if (summaries.length > 0) {
      void queryClient.prefetchQuery({
        queryKey: ["changelog", "entry", summaries[0].id],
        queryFn: () => fetchChangelogEntry(summaries[0].id),
      });
    }
  }, [summaries, queryClient]);

  const activeFilter: SearchFormValues = useMemo(
    () => ({
      eventType: activeFilterProp?.eventType ?? "",
      days: activeFilterProp?.days ?? "",
      timeStart: activeFilterProp?.timeStart ?? "",
      timeEnd: activeFilterProp?.timeEnd ?? "",
    }),
    [
      activeFilterProp?.eventType,
      activeFilterProp?.days,
      activeFilterProp?.timeStart,
      activeFilterProp?.timeEnd,
    ],
  );

  const handleSearch = (values: SearchFormValues): void => {
    if (!navigate) {
      return;
    }
    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        eventType: values.eventType || undefined,
        days: values.days || undefined,
        timeStart: values.timeStart || undefined,
        timeEnd: values.timeEnd || undefined,
      }),
      replace: false,
      resetScroll: false,
    });
  };

  const handleOpen = (index: number): void => {
    const current = summaries[index];
    if (current) {
      posthog.capture("changelog_entry_opened", { entry_id: current.id });
    }
    const next = summaries[index + 1];
    if (next) {
      void queryClient.prefetchQuery({
        queryKey: ["changelog", "entry", next.id],
        queryFn: () => fetchChangelogEntry(next.id),
      });
    }
  };

  return (
    <main className={styles.page}>
      <SearchForm values={activeFilter} onSearch={handleSearch} changelogMode />
      <div className={styles.content}>
        {isLoading && <EmptyState variant="loading" text="LOADING CHANGELOG…" />}
        {isError && <p>Could not load changelog. Try refreshing.</p>}
        {!isLoading && !isError && summaries.length === 0 && <p>No changelog entries yet.</p>}
        {summaries.length > 0 && (
          <>
            <h1 className={styles.heading}>Changelog</h1>
            <ColumnControlsPanel columnState={sharedColumnState} />
            <section className={styles.changelogSection}>
              {summaries.map((summary, i) => (
                <ChangelogRow
                  key={summary.id}
                  position={i + 1}
                  openParam={openParam}
                  navigate={navigate}
                  summary={summary}
                  onOpen={() => handleOpen(i)}
                  sharedColumnState={sharedColumnState}
                  activeFilter={activeFilter}
                />
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
