import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChangelogList, fetchChangelogEntry } from "../../utils/api";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { ColumnControlsPanel } from "../../ui/EventTable/ColumnControlsPanel";
import { ChangelogRow } from "./ChangelogRow";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import styles from "./ChangelogPage.module.css";

export function ChangelogPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const { typeDisplay, setTypeDisplay } = useTypeDisplay();
  const sharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
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
          <section>
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
