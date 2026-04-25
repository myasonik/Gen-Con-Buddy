import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Meeple } from "../ui/icons/Meeple";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <Meeple className={styles.headerMeeple} aria-hidden="true" />
        <div>
          <p>Gen Con Buddy</p>
          <p>your guide to the best four days in gaming</p>
        </div>
      </header>
      <Outlet />
    </>
  ),
});
