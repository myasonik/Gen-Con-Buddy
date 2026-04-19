import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchEvents } from "../../utils/api";

interface EventDetailProps {
  gameId: string;
}

export function EventDetail({ gameId }: EventDetailProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["event", gameId],
    queryFn: () => fetchEvents({ gameId, limit: 1 }),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading event.</p>;
  if (!data || data.data.length === 0) return <p>Event not found.</p>;

  const a = data.data[0].attributes;

  return (
    <article>
      <h1>{a.title}</h1>
      <dl>
        <dt>Game ID</dt>
        <dd>{a.gameId}</dd>
        <dt>Type</dt>
        <dd>{a.eventType}</dd>
        <dt>Group</dt>
        <dd>{a.group}</dd>
        <dt>Short Description</dt>
        <dd>{a.shortDescription}</dd>
        <dt>Long Description</dt>
        <dd>{a.longDescription}</dd>
        <dt>Game System</dt>
        <dd>{a.gameSystem}</dd>
        <dt>Rules Edition</dt>
        <dd>{a.rulesEdition}</dd>
        <dt>Min Players</dt>
        <dd>{a.minPlayers}</dd>
        <dt>Max Players</dt>
        <dd>{a.maxPlayers}</dd>
        <dt>Age Required</dt>
        <dd>{a.ageRequired}</dd>
        <dt>Experience Required</dt>
        <dd>{a.experienceRequired}</dd>
        <dt>Materials Provided</dt>
        <dd>{a.materialsProvided}</dd>
        <dt>Day</dt>
        <dd>{format(new Date(a.startDateTime), "EEEE")}</dd>
        <dt>Start</dt>
        <dd>{format(new Date(a.startDateTime), "HH:mm")}</dd>
        <dt>Duration</dt>
        <dd>{a.duration} hours</dd>
        <dt>End</dt>
        <dd>{format(new Date(a.endDateTime), "HH:mm")}</dd>
        <dt>GMs</dt>
        <dd>{a.gmNames}</dd>
        <dt>Website</dt>
        <dd>{a.website || "—"}</dd>
        <dt>Email</dt>
        <dd>{a.email || "—"}</dd>
        <dt>Tournament</dt>
        <dd>{a.tournament}</dd>
        <dt>Round</dt>
        <dd>
          {a.roundNumber} of {a.totalRounds}
        </dd>
        <dt>Min Play Time</dt>
        <dd>{a.minimumPlayTime} hours</dd>
        <dt>Attendee Registration</dt>
        <dd>{a.attendeeRegistration}</dd>
        <dt>Cost</dt>
        <dd>${a.cost.toFixed(2)}</dd>
        <dt>Location</dt>
        <dd>{a.location}</dd>
        <dt>Room</dt>
        <dd>{a.roomName}</dd>
        <dt>Table</dt>
        <dd>{a.tableNumber}</dd>
        <dt>Special Category</dt>
        <dd>{a.specialCategory}</dd>
        <dt>Tickets Available</dt>
        <dd>{a.ticketsAvailable}</dd>
        <dt>Rules Complexity</dt>
        <dd>{a.rulesComplexity}</dd>
        <dt>Prize</dt>
        <dd>{a.prize || "—"}</dd>
        <dt>Last Modified</dt>
        <dd>{format(new Date(a.lastModified), "yyyy-MM-dd")}</dd>
      </dl>
    </article>
  );
}
