# SEO Design

**Date:** 2026-05-14

## Summary

Add client-side SEO to Gen Con Buddy: per-route meta tags, Open Graph tags, a sitemap, a robots.txt, and Schema.org structured data on event detail pages. This is a client-side-only implementation — social crawlers (Discord, Slack, Twitter) will see the static homepage fallback rather than event-specific meta on event pages. A GitHub issue will track the server-side work needed to fix that.

Builds directly on the page-titles work from `2026-05-12-page-titles-design.md`, which established `usePageTitle`. This design supersedes `usePageTitle` — we consolidate title management into TanStack Router's `head()` API and remove the hook.

**Production URL:** `https://gcb.quest`

## Out of Scope

- Server-side rendering or pre-rendering
- Event-specific social previews (Discord/Slack/Twitter on `/event/$id`) — tracked in GitHub issue
- og:image generation

## Head Management

Use TanStack Router's built-in `head()` option on each route. Titles, meta descriptions, and og: tags are declared per-route as `{ meta: [...] }`. `<HeadContent />` from `@tanstack/react-router` renders them into the document head. Add `<HeadContent />` inside `<AppShell>` in `__root.tsx`, above the existing `<header>`.

The root route sets sitewide defaults (og:type, og:image, twitter:card). Child routes override title, description, and og:title/og:description.

`usePageTitle` is deleted in this change. Titles are fully owned by `head()` at the route level.

### Per-Route Meta

| Route          | title                                             | description                                                                                                   |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| root (default) | `Gen Con Buddy`                                   | `Fast, deeply filterable event search for Gen Con. Search across event type, time, location, cost, and more.` |
| `/`            | `Gen Con Buddy`                                   | _(same as root — root default applies)_                                                                       |
| `/changelog`   | `Changelog \| Gen Con Buddy`                      | `Track last-minute changes to the Gen Con event schedule — additions, updates, and removals.`                 |
| `/about`       | `About \| Gen Con Buddy`                          | `About Gen Con Buddy — a fast event search tool built for Gen Con attendees.`                                 |
| `/event/$id`   | `{event.title} ({event.gameId}) \| Gen Con Buddy` | `{eventType} event at Gen Con. GM: {gm}. {startDate}, {startTime}. {location}.`                               |

For `/event/$id`, the `head()` function receives `loaderData`. This requires the event detail loader to return the event object (currently it returns nothing). Change the loader to `return` the result of `ensureQueryData` so `loaderData` is typed and available in `head()`.

If the event is not found or the loader fails, `head()` falls back to the root defaults.

### Open Graph Tags (root default)

```
og:type       website
og:site_name  Gen Con Buddy
og:image      https://gcb.quest/og-image.png
og:image:width   1200
og:image:height  630
twitter:card  summary_large_image
```

Each route also sets `og:title` and `og:description` matching its `<title>` and `<meta name="description">`.

## Static Fallback in index.html

Add a full set of static meta tags to `index.html` as the always-visible fallback for crawlers that don't execute JavaScript (all social platforms). These always show homepage values.

```html
<meta
  name="description"
  content="Fast, deeply filterable event search for Gen Con. Search across event type, time, location, cost, and more."
/>
<meta property="og:title" content="Gen Con Buddy" />
<meta
  property="og:description"
  content="Fast, deeply filterable event search for Gen Con. Search across event type, time, location, cost, and more."
/>
<meta property="og:type" content="website" />
<meta property="og:url" content="https://gcb.quest/" />
<meta property="og:image" content="https://gcb.quest/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Gen Con Buddy" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Gen Con Buddy" />
<meta
  name="twitter:description"
  content="Fast, deeply filterable event search for Gen Con. Search across event type, time, location, cost, and more."
/>
```

`<HeadContent />` dynamically overwrites these for Google on navigation. The static fallbacks remain the source of truth for all social crawlers.

## og:image

A static `public/og-image.png` (1200×630). Content: the Gen Con Buddy wordmark and meeple icon on a warm background matching the site palette. This file must be created as part of this work — the spec does not prescribe exact pixels, but it must exist before the og:image meta tag is useful. Placeholder: copy `favicon.svg` to `og-image.png` and convert to PNG if no design resource is available.

## robots.txt

New file: `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://gcb.quest/sitemap.xml
```

## sitemap.xml

New file: `public/sitemap.xml`. Static pages only — event pages are excluded (thousands of them, no SSR to surface content reliably).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gcb.quest/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://gcb.quest/changelog</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://gcb.quest/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
```

## Schema.org Structured Data

On `/event/$id` only. Injected via TanStack Router `head()` as a `scripts` entry:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "{event.title}",
  "description": "{event.shortDescription}",
  "url": "https://gcb.quest/event/{event.gameId}",
  "startDate": "{event.startDateTime}",
  "endDate": "{event.endDateTime}",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "{event.location}",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Indianapolis",
      "addressRegion": "IN",
      "addressCountry": "US"
    }
  },
  "organizer": {
    "@type": "Person",
    "name": "{event.gm}"
  },
  "offers": {
    "@type": "Offer",
    "price": "{event.cost}",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock" // SoldOut when ticketsAvailable === 0
  }
}
```

Only emitted when event data is present in `loaderData`. The `scripts` entry uses `type: "application/ld+json"` and `children: JSON.stringify(structuredData)`.

## GitHub Issue

File one issue in `myasonik/Gen-Con-Buddy`:

**Title:** `feat: server-side social preview meta tags for event pages`

**Body:** Explain that `/event/$id` currently shows static homepage og: tags when shared on Discord/Slack/Twitter because social crawlers don't execute JavaScript. To fix, the API needs bot-detection middleware: inspect the `User-Agent` header, and if it matches known social crawlers, fetch the event from the database and return a minimal HTML document with og: tags populated. Normal browser requests pass through to the Vite SPA as usual. Label: `needs-triage`.

## Files Changed

- `index.html` — add static meta tag block
- `public/robots.txt` — new
- `public/sitemap.xml` — new
- `public/og-image.png` — new (1200×630)
- `src/routes/__root.tsx` — add `<HeadContent />`, add root-level `head()` with sitewide defaults
- `src/routes/index.tsx` — add `head()` with homepage meta; remove `usePageTitle` call
- `src/routes/changelog.tsx` — add `head()` with changelog meta
- `src/routes/about.tsx` — add `head()` with about meta
- `src/routes/event.$id.tsx` — add `head()` with event meta + JSON-LD; change loader to return event data; remove `usePageTitle` delegation to `EventDetail`
- `src/components/EventDetail/EventDetail.tsx` — remove `usePageTitle` call
- `src/lib/usePageTitle.ts` — delete
- `src/lib/usePageTitle.test.ts` — delete (tests become irrelevant)

## Testing

- `src/routes/__root.test.tsx` — verify `<HeadContent />` is rendered
- `src/routes/index.test.tsx` — verify `document.title` and og:title meta are set correctly
- `src/routes/changelog.test.tsx` — same
- `src/routes/about.test.tsx` — same (page already has a test file)
- `src/routes/event.$id.test.tsx` — verify title, og:description, and JSON-LD script tag after event loads; verify fallback when event not found
