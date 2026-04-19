import { createRootRoute, Outlet } from "@tanstack/react-router";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <p className={styles.headerTitle}>GEN CON BUDDY</p>
      </header>
      <Outlet />
    </>
  ),
});
