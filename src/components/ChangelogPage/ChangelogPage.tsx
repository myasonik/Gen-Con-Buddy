import { useEffect, useState } from "react";
import { fetchChangelogList } from "../../utils/api";
import type { ChangelogSummary } from "../../utils/types";
import { useChangelogPrefetch } from "./useChangelogPrefetch";
import { ChangelogRow } from "./ChangelogRow";
import { PixelState } from "../../ui/PixelState/PixelState";
import styles from "./ChangelogPage.module.css";

export function ChangelogPage() {
  const [summaries, setSummaries] = useState<ChangelogSummary[]>([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">(
    "loading",
  );
  const { getEntry, openEntry } = useChangelogPrefetch(summaries);

  useEffect(() => {
    fetchChangelogList()
      .then((res) => {
        if (res.error) {
          setListState("error");
        } else {
          setSummaries(res.entries ?? []);
          setListState("done");
        }
      })
      .catch(() => setListState("error"));
  }, []);

  return (
    <main className={styles.page}>
      {listState === "loading" && (
        <PixelState variant="loading" text="LOADING CHANGELOG…" />
      )}
      {listState === "error" && (
        <p>Could not load changelog. Try refreshing.</p>
      )}
      {listState === "done" && summaries.length === 0 && (
        <p>No changelog entries yet.</p>
      )}
      {listState === "done" && summaries.length > 0 && (
        <>
          <h1 className={styles.heading}>Changelog</h1>
          <section>
            {summaries.map((summary, i) => (
              <ChangelogRow
                key={summary.id}
                summary={summary}
                entry={getEntry(summary.id)}
                onOpen={() => openEntry(i)}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
