import { useEffect } from "react";
import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { Meeple3D } from "../ui/icons/Meeple3D";
import indexStyles from "./index.module.css";
import rootStyles from "./__root.module.css";

function RootLayout(): React.JSX.Element {
  const posthog = usePostHog();
  const { location } = useRouterState();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [location.href, posthog]);

  return (
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
  );
}

export const Route = createRootRoute({
  component: () => (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string}
      options={{
        api_host: "/ingest",
        ui_host: (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || "https://us.posthog.com",
        defaults: "2026-01-30",
        capture_exceptions: true,
        debug: import.meta.env.DEV,
      }}
    >
      <RootLayout />
    </PostHogProvider>
  ),
});
