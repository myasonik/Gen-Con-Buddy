import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchEvents } from "../utils/api";
import { EventDetail } from "../components/EventDetail/EventDetail";
import type { EventAttributes } from "../utils/types";

function formatEventDescription(a: EventAttributes): string {
  const dateTime = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Indianapolis",
  }).format(new Date(a.startDateTime));
  return `${a.eventType} event at Gen Con. GM: ${a.gmNames}. ${dateTime}. ${a.location}.`;
}

export const Route = createFileRoute("/event/$id")({
  head: ({ loaderData }) => {
    const event = loaderData?.data[0];
    if (!event) {
      return {};
    }
    const a = event.attributes;
    const title = `${a.title} (${a.gameId}) | Gen Con Buddy`;
    const description = formatEventDescription(a);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: a.title,
            description: a.shortDescription,
            url: `https://gcb.quest/event/${a.gameId}`,
            startDate: a.startDateTime,
            endDate: a.endDateTime,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            location: {
              "@type": "Place",
              name: a.location,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Indianapolis",
                addressRegion: "IN",
                addressCountry: "US",
              },
            },
            organizer: { "@type": "Person", name: a.gmNames },
            offers: {
              "@type": "Offer",
              price: a.cost,
              priceCurrency: "USD",
              availability:
                a.ticketsAvailable > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/SoldOut",
            },
          }),
        },
      ],
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["event", params.id],
      queryFn: () => fetchEvents({ gameId: params.id, limit: 1 }),
    }),
  component: EventDetailPage,
});

function EventDetailPage(): React.JSX.Element {
  const { id } = Route.useParams();
  return (
    <main>
      <EventDetail gameId={id} />
    </main>
  );
}
