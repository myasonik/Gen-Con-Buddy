import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ColumnControlsPanel } from "../../ui/EventTable/ColumnControlsPanel";
import { fetchChangelogEntry, fetchChangelogList } from "../../utils/api";
import styles from "./ChangelogPage.module.css";
import { ChangelogRow } from "./ChangelogRow";

export function ChangelogPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const sharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
  };
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
          <ColumnControlsPanel columnState={sharedColumnState} />
          <section className={styles.changelogSection}>
            {summaries.map((summary, i) => (
              <ChangelogRow
                key={summary.id}
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
