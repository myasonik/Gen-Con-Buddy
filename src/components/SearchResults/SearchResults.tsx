import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useColumnVisibility } from '../../hooks/useColumnVisibility'
import { fetchEvents } from '../../utils/api'
import type { SearchParams, Event } from '../../utils/types'

interface SearchResultsProps {
  searchParams: SearchParams
}

const COLUMNS = [
  { key: 'gameId', label: 'Game ID' },
  { key: 'title', label: 'Title' },
  { key: 'eventType', label: 'Type' },
  { key: 'group', label: 'Group' },
  { key: 'shortDescription', label: 'Short Description' },
  { key: 'longDescription', label: 'Long Description' },
  { key: 'gameSystem', label: 'Game System' },
  { key: 'rulesEdition', label: 'Rules Edition' },
  { key: 'minPlayers', label: 'Min Players' },
  { key: 'maxPlayers', label: 'Max Players' },
  { key: 'ageRequired', label: 'Age Required' },
  { key: 'experienceRequired', label: 'Experience Required' },
  { key: 'materialsProvided', label: 'Materials Provided' },
  { key: 'materialsRequired', label: 'Materials Required' },
  { key: 'materialsRequiredDetails', label: 'Materials Required Details' },
  { key: 'day', label: 'Day' },
  { key: 'startDateTime', label: 'Start' },
  { key: 'duration', label: 'Duration' },
  { key: 'endDateTime', label: 'End' },
  { key: 'gmNames', label: 'GMs' },
  { key: 'website', label: 'Website' },
  { key: 'email', label: 'Email' },
  { key: 'tournament', label: 'Tournament' },
  { key: 'roundNumber', label: 'Round Number' },
  { key: 'totalRounds', label: 'Total Rounds' },
  { key: 'minimumPlayTime', label: 'Min Time' },
  { key: 'attendeeRegistration', label: 'Attendee Registration' },
  { key: 'cost', label: 'Cost' },
  { key: 'location', label: 'Location' },
  { key: 'roomName', label: 'Room' },
  { key: 'tableNumber', label: 'Table Number' },
  { key: 'specialCategory', label: 'Special Category' },
  { key: 'ticketsAvailable', label: 'Tickets Available' },
  { key: 'lastModified', label: 'Last Modified' },
] as const

type ColumnKey = (typeof COLUMNS)[number]['key']

function EventCell({ col, event }: { col: ColumnKey; event: Event }) {
  const { attributes: a, attributes: { gameId } } = event
  const link = (text: React.ReactNode) => (
    <Link to="/event/$id" params={{ id: gameId }}>{text}</Link>
  )
  switch (col) {
    case 'gameId': return <td>{link(a.gameId)}</td>
    case 'title': return <td>{link(a.title)}</td>
    case 'eventType': return <td>{a.eventType}</td>
    case 'group': return <td>{a.group}</td>
    case 'shortDescription': return <td>{a.shortDescription}</td>
    case 'longDescription': return <td>{a.longDescription}</td>
    case 'gameSystem': return <td>{a.gameSystem}</td>
    case 'rulesEdition': return <td>{a.rulesEdition}</td>
    case 'minPlayers': return <td>{a.minPlayers}</td>
    case 'maxPlayers': return <td>{a.maxPlayers}</td>
    case 'ageRequired': return <td>{a.ageRequired}</td>
    case 'experienceRequired': return <td>{a.experienceRequired}</td>
    case 'materialsProvided': return <td>{a.materialsProvided}</td>
    case 'materialsRequired': return <td>{a.materialsRequired}</td>
    case 'materialsRequiredDetails': return <td>{a.materialsRequiredDetails}</td>
    case 'day': return <td>{format(new Date(a.startDateTime), 'EEEE')}</td>
    case 'startDateTime': return <td>{format(new Date(a.startDateTime), 'HH:mm')}</td>
    case 'duration': return <td>{a.duration}</td>
    case 'endDateTime': return <td>{format(new Date(a.endDateTime), 'HH:mm')}</td>
    case 'gmNames': return <td>{a.gmNames}</td>
    case 'website': return <td>{a.website}</td>
    case 'email': return <td>{a.email}</td>
    case 'tournament': return <td>{a.tournament}</td>
    case 'roundNumber': return <td>{a.roundNumber}</td>
    case 'totalRounds': return <td>{a.totalRounds}</td>
    case 'minimumPlayTime': return <td>{a.minimumPlayTime}</td>
    case 'attendeeRegistration': return <td>{a.attendeeRegistration}</td>
    case 'cost': return <td>${a.cost.toFixed(2)}</td>
    case 'location': return <td>{a.location}</td>
    case 'roomName': return <td>{a.roomName}</td>
    case 'tableNumber': return <td>{a.tableNumber}</td>
    case 'specialCategory': return <td>{a.specialCategory}</td>
    case 'ticketsAvailable': return <td>{a.ticketsAvailable}</td>
    case 'lastModified': return <td>{format(new Date(a.lastModified), 'yyyy-MM-dd')}</td>
  }
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const { visibility, toggle, reset } = useColumnVisibility()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', searchParams],
    queryFn: () => fetchEvents(searchParams),
  })

  const visibleColumns = COLUMNS.filter((col) => visibility[col.key])

  return (
    <section>
      <details>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
              <li key={col.key}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.key]}
                    onChange={() => toggle(col.key)}
                  />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>Reset to defaults</button>
        </fieldset>
      </details>

      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading events.</p>}
      {data && data.data.length === 0 && <p>No events found.</p>}
      {data && data.data.length > 0 && (
        <table>
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((event) => (
              <tr key={event.id}>
                {visibleColumns.map((col) => (
                  <EventCell key={col.key} col={col.key} event={event} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
