import styles from "./AboutPage.module.css";

export function AboutPage(): JSX.Element {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.heading}>About Gen Con Buddy</h1>
        <hr className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Contribute</h2>
          <p className={styles.bodyText}>
            Gen Con Buddy is{" "}
            <a
              href="https://github.com/myasonik/Gen-Con-Buddy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bodyLink}
            >
              open source on GitHub
            </a>
            . Found a bug or have a feature request? Open an issue there.
          </p>
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
