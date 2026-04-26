import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChangelogList, fetchChangelogEntry } from "../../utils/api";
import { ChangelogRow } from "./ChangelogRow";
import { PixelState } from "../../ui/PixelState/PixelState";
import styles from "./ChangelogPage.module.css";

export function ChangelogPage() {
  const queryClient = useQueryClient();
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

  const handleOpen = (index: number) => {
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
      {isLoading && <PixelState variant="loading" text="LOADING CHANGELOG…" />}
      {isError && <p>Could not load changelog. Try refreshing.</p>}
      {!isLoading && !isError && summaries.length === 0 && (
        <p>No changelog entries yet.</p>
      )}
      {summaries.length > 0 && (
        <>
          <h1 className={styles.heading}>Changelog</h1>
          <section>
            {summaries.map((summary, i) => (
              <ChangelogRow
                key={summary.id}
                summary={summary}
                onOpen={() => handleOpen(i)}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
