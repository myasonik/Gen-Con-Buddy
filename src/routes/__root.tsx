import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Meeple3D } from "../ui/icons/Meeple3D";
import indexStyles from "./index.module.css";
import rootStyles from "./__root.module.css";

export const Route = createRootRoute({
  component: () => (
    <div className={indexStyles.page}>
      <header role="banner" className={indexStyles.header}>
        <Link to="/" className={rootStyles.brandingTitle}>
          <Meeple3D size={32} aria-hidden="true" />
          Gen Con Buddy
        </Link>
        <p className={rootStyles.tagline}>your guide to the best four days in gaming</p>
        <nav className={rootStyles.nav}>
          <Link to="/" activeOptions={{ exact: true }}>
            Search
          </Link>
          <Link to="/changelog">Changelog</Link>
        </nav>
      </header>
      <Outlet />
      <footer className={rootStyles.footer}>
        <Link to="/about" className={rootStyles.footerLink}>
          About
        </Link>
      </footer>
    </div>
  ),
});
