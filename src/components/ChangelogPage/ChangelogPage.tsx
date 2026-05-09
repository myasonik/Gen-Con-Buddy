import React, { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NavigateFn } from "@tanstack/react-router";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { FormatDrawer } from "../EventTable/FormatDrawer";
import { fetchChangelogEntry, fetchChangelogList } from "../../utils/api";
import styles from "./ChangelogPage.module.css";
import { ChangelogRow } from "./ChangelogRow";

interface ChangelogPageProps {
  openParam?: string[];
  navigate?: NavigateFn;
}

export function ChangelogPage({ openParam = [], navigate }: ChangelogPageProps): React.JSX.Element {
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

  const handleOpen = (index: number): void => {
    const current = summaries[index];
    if (current) {
      posthog.capture("changelog_entry_opened", {
        entry_id: current.id,
      });
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
      {isLoading && <EmptyState variant="loading" text="LOADING CHANGELOG…" />}
      {isError && <p>Could not load changelog. Try refreshing.</p>}
      {!isLoading && !isError && summaries.length === 0 && <p>No changelog entries yet.</p>}
      {summaries.length > 0 && (
        <>
          <h1 className={styles.heading}>Changelog</h1>
          <div className={styles.controls}>
            <VisibilityDrawer columnState={sharedColumnState} />
            <FormatDrawer columnState={sharedColumnState} />
          </div>
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
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
