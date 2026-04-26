import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import indexStyles from "./index.module.css";
import rootStyles from "./__root.module.css";

export const Route = createRootRoute({
  component: () => (
    <div className={indexStyles.page}>
      <header role="banner" className={indexStyles.header}>
        <h1>Gen Con Buddy</h1>
        <p>your guide to the best four days in gaming</p>
        <nav className={rootStyles.nav}>
          <Link to="/">Search</Link>
          <Link to="/changelog">Changelog</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  ),
});
