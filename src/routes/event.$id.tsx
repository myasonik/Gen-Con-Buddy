import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchEvents } from "../utils/api";
import { EventDetail } from "../components/EventDetail/EventDetail";

export const Route = createFileRoute("/event/$id")({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["event", params.id],
      queryFn: () => fetchEvents({ gameId: params.id, limit: 1 }),
    });
  },
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
