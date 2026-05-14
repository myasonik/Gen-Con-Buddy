import { useEffect } from "react";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { Meeple3D } from "../ui/icons/Meeple3D";
import { useTheme } from "../hooks/useTheme";
import { ThemePopover } from "../components/ThemePopover/ThemePopover";
import { MobileNav } from "../components/MobileNav/MobileNav";
import indexStyles from "./index.module.css";
import rootStyles from "./__root.module.css";

const POSTHOG_TOKEN = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined;

function PageViewTracker(): null {
  const posthog = usePostHog();
  const { location } = useRouterState();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [location.href, posthog]);

  return null;
}

const SITE_DESCRIPTION =
  "Fast, deeply filterable event search for Gen Con. Search across event type, time, location, cost, and more.";

function AppShell(): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  return (
    <div className={indexStyles.page}>
      <HeadContent />
      {POSTHOG_TOKEN && <PageViewTracker />}
      <header role="banner" className={indexStyles.header}>
        <Link to="/" className={rootStyles.brandingTitle}>
          <Meeple3D size={32} aria-hidden="true" />
          Gen Con Buddy
        </Link>
        <p className={rootStyles.tagline}>your guide to the best four days in gaming</p>
        <nav className={rootStyles.nav}>
          <Link to="/" activeOptions={{ exact: true, includeSearch: false }}>
            Search
          </Link>
          <Link
            to="/changelog"
            search={{
              open: [],
              eventType: undefined,
              days: undefined,
              timeStart: undefined,
              timeEnd: undefined,
            }}
            activeOptions={{ includeSearch: false }}
          >
            Changelog
          </Link>
          <ThemePopover theme={theme} setTheme={setTheme} />
        </nav>
        <div className={rootStyles.mobileNav}>
          <MobileNav theme={theme} setTheme={setTheme} />
        </div>
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

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: "Gen Con Buddy" },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Gen Con Buddy" },
      { property: "og:title", content: "Gen Con Buddy" },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:image", content: "https://gcb.quest/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://gcb.quest/" },
      { name: "twitter:title", content: "Gen Con Buddy" },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
  }),
  component: (): React.JSX.Element =>
    POSTHOG_TOKEN ? (
      <PostHogProvider
        apiKey={POSTHOG_TOKEN}
        options={{
          api_host: "/ingest",
          ui_host: (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || "https://us.posthog.com",
          defaults: "2026-01-30",
          capture_exceptions: true,
          debug: import.meta.env.DEV,
        }}
      >
        <AppShell />
      </PostHogProvider>
    ) : (
      <AppShell />
    ),
});
