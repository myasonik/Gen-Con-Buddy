import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <div className={styles.page}>
      <header role="banner" className={styles.header}>
        <h1>Gen Con Buddy</h1>
        <p>your guide to the best four days in gaming</p>
        <nav className={styles.nav}>
          <Link to="/">Search</Link>
          <Link to="/changelog">Changelog</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  ),
});
