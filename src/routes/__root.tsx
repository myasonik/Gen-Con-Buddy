import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Meeple } from "../ui/icons/Meeple";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <Meeple
          className={styles.headerMeeple}
          frontFill="var(--color-parchment)"
          shadowFill="rgba(0,0,0,0.35)"
          stroke="var(--color-parchment)"
          strokeWidth={8}
          aria-hidden="true"
        />
        <div>
          <p className={styles.headerTitle}>Gen Con Buddy</p>
          <p className={styles.headerSubtitle}>
            your guide to the best four days in gaming
          </p>
        </div>
      </header>
      <Outlet />
    </>
  ),
});
