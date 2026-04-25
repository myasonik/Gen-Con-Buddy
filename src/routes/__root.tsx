import { createRootRoute, Outlet } from "@tanstack/react-router";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <h1>Gen Con Buddy</h1>
        <p>your guide to the best four days in gaming</p>
      </header>
      <Outlet />
    </>
  ),
});
