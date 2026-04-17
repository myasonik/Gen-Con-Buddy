import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fetchEvents } from '../../utils/api'

interface EventDetailProps {
  gameId: string
}

export function EventDetail({ gameId }: EventDetailProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['event', gameId],
    queryFn: () => fetchEvents({ gameId, limit: 1 }),
  })

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>Error loading event.</p>
  if (!data || data.data.length === 0) return <p>Event not found.</p>

  const a = data.data[0].attributes

  return (
    <article>
      <h1>{a.title}</h1>
      <dl>
        <dt>{a.gameId}</dt>
        <dd>{a.eventType} &mdash; {a.group}</dd>
      </dl>
      <table>
        <tbody>
          <tr><th>Short Description</th><td>{a.shortDescription}</td></tr>
          <tr><th>Long Description</th><td>{a.longDescription}</td></tr>
          <tr><th>Game System</th><td>{a.gameSystem}</td></tr>
          <tr><th>Rules Edition</th><td>{a.rulesEdition}</td></tr>
          <tr><th>Min Players</th><td>{a.minPlayers}</td></tr>
          <tr><th>Max Players</th><td>{a.maxPlayers}</td></tr>
          <tr><th>Age Required</th><td>{a.ageRequired}</td></tr>
          <tr><th>Experience Required</th><td>{a.experienceRequired}</td></tr>
          <tr><th>Materials Provided</th><td>{a.materialsProvided}</td></tr>
          <tr><th>Day</th><td>{format(new Date(a.startDateTime), 'EEEE')}</td></tr>
          <tr><th>Start</th><td>{format(new Date(a.startDateTime), 'HH:mm')}</td></tr>
          <tr><th>Duration</th><td>{a.duration} hours</td></tr>
          <tr><th>End</th><td>{format(new Date(a.endDateTime), 'HH:mm')}</td></tr>
          <tr><th>GMs</th><td>{a.gmNames}</td></tr>
          <tr><th>Website</th><td>{a.website || '—'}</td></tr>
          <tr><th>Email</th><td>{a.email || '—'}</td></tr>
          <tr><th>Tournament</th><td>{a.tournament}</td></tr>
          <tr><th>Round</th><td>{a.roundNumber} of {a.totalRounds}</td></tr>
          <tr><th>Min Play Time</th><td>{a.minimumPlayTime} hours</td></tr>
          <tr><th>Attendee Registration</th><td>{a.attendeeRegistration}</td></tr>
          <tr><th>Cost</th><td>${a.cost.toFixed(2)}</td></tr>
          <tr><th>Location</th><td>{a.location}</td></tr>
          <tr><th>Room</th><td>{a.roomName}</td></tr>
          <tr><th>Table</th><td>{a.tableNumber}</td></tr>
          <tr><th>Special Category</th><td>{a.specialCategory}</td></tr>
          <tr><th>Tickets Available</th><td>{a.ticketsAvailable}</td></tr>
          <tr><th>Rules Complexity</th><td>{a.rulesComplexity}</td></tr>
          <tr><th>Prize</th><td>{a.prize || '—'}</td></tr>
          <tr><th>Last Modified</th><td>{format(new Date(a.lastModified), 'yyyy-MM-dd')}</td></tr>
        </tbody>
      </table>
    </article>
  )
}
