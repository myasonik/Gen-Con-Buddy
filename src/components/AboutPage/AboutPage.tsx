import styles from "./AboutPage.module.css";

export function AboutPage(): JSX.Element {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.heading}>About Gen Con Buddy</h1>
        <p className={styles.intro}>
          A fast, deeply filterable event search tool for Gen Con attendees. Search across 30+
          criteria — type, time, location, cost, player counts, game system — and navigate from
          results to detail and back.
        </p>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Contribute</h2>
          <p className={styles.bodyText}>
            Gen Con Buddy is open source. Found a bug or have a feature request? Open an issue on
            GitHub.
          </p>
          <a
            href="https://github.com/myasonik/Gen-Con-Buddy"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
          >
            View on GitHub
          </a>
        </section>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Event Data</h2>
          <p className={styles.bodyText}>
            Event data comes from Gen Con&rsquo;s official event export. Gen Con Buddy was inspired
            by{" "}
            <a
              href="https://gencon.eventdb.us/about.php"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bodyLink}
            >
              EventDB
            </a>
            , a community-built event browser many of us relied on for years.
          </p>
        </section>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Icons</h2>
          <p className={styles.bodyText}>
            Icons from{" "}
            <a
              href="https://game-icons.net"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bodyLink}
            >
              game-icons.net
            </a>{" "}
            by Lorc, Delapouite, and contributors, licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bodyLink}
            >
              CC BY 3.0
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
